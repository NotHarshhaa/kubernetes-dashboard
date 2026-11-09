"use client";

import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Info,
  Lightbulb,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type DiagnosticRequest, type DiagnosticResult, getClientAiSettings } from "@/lib/ai-diagnostics";
import { apiClient } from "@/lib/api-client";

interface AiDiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DiagnosticRequest | null;
}

export function AiDiagnosticsDialog({ open, onOpenChange, request }: AiDiagnosticsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const runDiagnosis = useCallback(async () => {
    if (!request?.podName || !request.namespace) return;
    setLoading(true);
    try {
      const settings = getClientAiSettings();
      // Fetch fresh pod logs if not provided in request
      let logsToUse = request.logs;
      if (!logsToUse) {
        try {
          logsToUse = await apiClient.getPodLogs(request.namespace, request.podName, request.container);
        } catch {
          // logs might fail if pod is pending/crashed
        }
      }

      const diagData = await apiClient.diagnoseWithAi({ ...request, logs: logsToUse }, settings);
      setResult(diagData);
    } catch (err) {
      toast.error(`AI Diagnosis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (open && request) {
      void runDiagnosis();
    } else if (!open) {
      setResult(null);
    }
  }, [open, request, runDiagnosis]);

  const handleCopyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getSeverityBadge = (severity: DiagnosticResult["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <Badge variant="destructive" className="font-mono text-[10px]">
            CRITICAL
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
            HIGH
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px]">
            MEDIUM
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px]">
            LOW
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col p-5 sm:max-w-3xl overflow-hidden">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <span>AI Error Diagnostics Copilot</span>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-xs">
                <span>
                  Target Pod: <strong className="text-foreground font-mono">{request?.podName}</strong>
                </span>
                <span>•</span>
                <span>
                  Namespace: <strong className="text-foreground font-mono">{request?.namespace}</strong>
                </span>
                {request?.container && (
                  <>
                    <span>•</span>
                    <span>
                      Container: <strong className="text-foreground font-mono">{request.container}</strong>
                    </span>
                  </>
                )}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnosis}
                disabled={loading}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                Re-diagnose
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7 animate-pulse text-indigo-500" />
              <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/30 animate-ping" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Analyzing Pod Telemetry & Logs...</h4>
              <p className="text-muted-foreground text-xs max-w-sm">
                Examining exit codes, crash loop patterns, resource boundaries, and Kubelet events.
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 text-xs">
            {/* Provider banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px]"
                >
                  <Bot className="size-3" />
                  {result.providerUsed}
                </Badge>
                {getSeverityBadge(result.severity)}
              </div>

              {!result.isAiGenerated && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <Info className="size-3.5 text-amber-500" />
                  <span>Configure your API Key in</span>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    Settings <Settings className="size-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Summary Banner */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
              <p className="text-foreground text-xs font-medium leading-relaxed">{result.summary}</p>
            </div>

            {/* Root Cause & Impact */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border p-3 bg-muted/10 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <ShieldAlert className="size-3.5 text-destructive" />
                  <span>Root Cause Analysis</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{result.rootCause}</p>
              </div>

              <div className="rounded-xl border p-3 bg-muted/10 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  <span>Workload Impact</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{result.impact}</p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="rounded-xl border p-3.5 space-y-2 bg-muted/10">
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                <Lightbulb className="size-3.5 text-amber-500" />
                <span>Recommended Action Plan</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                {result.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-normal">
                    <ChevronRight className="size-3 text-primary mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Remediation Commands */}
            {result.remediationCommands.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                    <Terminal className="size-3.5 text-primary" />
                    <span>Remediation CLI Commands</span>
                  </div>
                  <Link
                    href="/dashboard/terminal"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    Open Web Terminal <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {result.remediationCommands.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between rounded-lg border bg-zinc-950 p-2 font-mono text-xs text-zinc-100 shadow-inner"
                    >
                      <span className="truncate pr-2 text-zinc-200 select-all">$ {cmd}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyCommand(cmd, idx)}
                        className="size-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Copy command"
                      >
                        {copiedIndex === idx ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Info className="size-6 opacity-40" />
            <p className="text-xs">Select a pod or trigger diagnostic to view analysis.</p>
          </div>
        )}

        <Separator className="mt-2" />
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-muted-foreground">Powered by Kubernetes Dashboard SRE Copilot</span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7 text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
