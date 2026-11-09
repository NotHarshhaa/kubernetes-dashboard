import { type NextRequest, NextResponse } from "next/server";

import {
  type AiSettings,
  analyzeKubernetesErrorHeuristically,
  type DiagnosticRequest,
  type DiagnosticResult,
} from "@/lib/ai-diagnostics";

interface DiagnoseRequestBody {
  request: DiagnosticRequest;
  settings?: Partial<AiSettings>;
}

const SYSTEM_PROMPT = `You are a Kubernetes Reliability & Site Reliability Engineering (SRE) Diagnostic Copilot.
Your job is to analyze failed or misbehaving Kubernetes Pods, container exit codes, crash logs, and events, and produce an accurate, actionable diagnosis.

You MUST respond strictly with a valid JSON object with the following schema:
{
  "summary": "1-2 sentence high-level overview of the failure",
  "rootCause": "Detailed explanation of the exact underlying technical cause",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "impact": "Production impact and workload availability consequences",
  "recommendedActions": ["Clear, step-by-step remediation recommendation 1", "recommendation 2", ...],
  "remediationCommands": ["kubectl command 1", "kubectl command 2", ...]
}
Do not include any conversational filler, backticks, or markdown outside the JSON object. Output pure JSON.`;

function buildUserPrompt(req: DiagnosticRequest): string {
  return `Pod Name: ${req.podName}
Namespace: ${req.namespace}
Container: ${req.container || "main"}
Status: ${req.status || "Unknown"}
Phase: ${req.phase || "Unknown"}
Exit Code: ${req.exitCode !== undefined ? req.exitCode : "Unknown"}
Failure Reason: ${req.reason || "None specified"}
User Note/Query: ${req.userQuery || "Please diagnose this pod issue and give remediation steps."}

Pod Logs Snippet:
${req.logs ? req.logs.slice(-2500) : "No recent logs captured."}

Kubernetes Events:
${req.events || "No events recorded."}`;
}

async function callOpenAi(
  apiKey: string,
  model: string,
  userPrompt: string,
  customBaseUrl?: string,
): Promise<Partial<DiagnosticResult>> {
  const endpoint = customBaseUrl
    ? `${customBaseUrl.replace(/\/+$/, "")}/chat/completions`
    : "https://api.openai.com/v1/chat/completions";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response received from OpenAI");
  return JSON.parse(content) as Partial<DiagnosticResult>;
}

async function callGemini(apiKey: string, model: string, userPrompt: string): Promise<Partial<DiagnosticResult>> {
  const modelName = model || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }, { text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response received from Gemini");
  return JSON.parse(text) as Partial<DiagnosticResult>;
}

async function callAnthropic(apiKey: string, model: string, userPrompt: string): Promise<Partial<DiagnosticResult>> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const textPart = json.content?.find((c) => c.type === "text")?.text;
  if (!textPart) throw new Error("No response content received from Anthropic");

  // Extract JSON if wrapped in markdown code blocks
  const match = textPart.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Anthropic response did not contain valid JSON");
  return JSON.parse(match[0]) as Partial<DiagnosticResult>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DiagnoseRequestBody;
    const { request: diagReq, settings = {} } = body;

    if (!diagReq?.podName || !diagReq.namespace) {
      return NextResponse.json({ error: "Invalid request: podName and namespace are required." }, { status: 400 });
    }

    const provider = settings.provider || "openai";
    const apiKey =
      settings.apiKey?.trim() ||
      (provider === "gemini"
        ? process.env.GEMINI_API_KEY || process.env.AI_API_KEY
        : provider === "anthropic"
          ? process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY
          : process.env.OPENAI_API_KEY || process.env.AI_API_KEY) ||
      "";

    const customEndpoint = settings.customEndpoint?.trim();
    const model = settings.model?.trim() || "";

    // If disabled or no key provided (and not custom endpoint with no auth), use built-in heuristics
    if (settings.enabled === false || (!apiKey && !customEndpoint)) {
      const fallbackResult = analyzeKubernetesErrorHeuristically(diagReq);
      return NextResponse.json<DiagnosticResult>(fallbackResult);
    }

    const userPrompt = buildUserPrompt(diagReq);
    let parsed: Partial<DiagnosticResult> | null = null;
    let providerLabel = "AI Diagnostic Copilot";

    try {
      if (provider === "gemini") {
        providerLabel = `Google Gemini (${model || "gemini-1.5-flash"})`;
        parsed = await callGemini(apiKey, model, userPrompt);
      } else if (provider === "anthropic") {
        providerLabel = `Anthropic Claude (${model || "claude-3-5-sonnet"})`;
        parsed = await callAnthropic(apiKey, model, userPrompt);
      } else if (provider === "custom") {
        providerLabel = `Custom LLM (${model || "custom"})`;
        parsed = await callOpenAi(apiKey || "dummy-key", model || "llama3", userPrompt, customEndpoint);
      } else {
        providerLabel = `OpenAI (${model || "gpt-4o-mini"})`;
        parsed = await callOpenAi(apiKey, model, userPrompt);
      }
    } catch (llmError) {
      console.warn("LLM Diagnostic call failed, falling back to heuristics:", llmError);
      const fallback = analyzeKubernetesErrorHeuristically(diagReq);
      return NextResponse.json<DiagnosticResult>({
        ...fallback,
        providerUsed: `Built-in Heuristics (LLM error: ${llmError instanceof Error ? llmError.message : "Request failed"})`,
      });
    }

    if (!parsed?.summary) {
      const fallback = analyzeKubernetesErrorHeuristically(diagReq);
      return NextResponse.json<DiagnosticResult>(fallback);
    }

    const finalResult: DiagnosticResult = {
      summary: parsed.summary || "Diagnostic completed.",
      rootCause: parsed.rootCause || "Root cause could not be determined with high certainty.",
      severity: parsed.severity || "MEDIUM",
      impact: parsed.impact || "Service degradation may occur.",
      recommendedActions:
        Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0
          ? parsed.recommendedActions
          : ["Inspect container logs", "Describe pod status for events"],
      remediationCommands:
        Array.isArray(parsed.remediationCommands) && parsed.remediationCommands.length > 0
          ? parsed.remediationCommands
          : [`kubectl describe pod ${diagReq.podName} -n ${diagReq.namespace}`],
      isAiGenerated: true,
      providerUsed: providerLabel,
      modelUsed: model || undefined,
    };

    return NextResponse.json<DiagnosticResult>(finalResult);
  } catch (error) {
    console.error("Diagnostic endpoint error:", error);
    return NextResponse.json(
      { error: "Diagnostic failure", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
