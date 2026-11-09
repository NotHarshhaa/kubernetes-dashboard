"use client";

import {
  Bot,
  Check,
  Download,
  Eye,
  EyeOff,
  HardDriveDownload,
  Info,
  Key,
  RefreshCw,
  Save,
  Server,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DockerAccountDialog } from "@/app/(main)/dashboard/registry/_components/docker-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  type AiProvider,
  type AiSettings,
  DEFAULT_AI_SETTINGS,
  getClientAiSettings,
  saveClientAiSettings,
} from "@/lib/ai-diagnostics";
import { apiClient, type ClusterInfo, type ContextItem } from "@/lib/api-client";
import { type DockerAccount, getStoredDockerAccount } from "@/lib/docker-registry";

type SaveStatus = "idle" | "saving" | "saved";

const MODEL_PRESETS: Record<AiProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "o1-mini"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  custom: ["llama3", "mistral", "deepseek-r1", "qwen2.5"],
};

export function SettingsView() {
  const [clusterName, setClusterName] = useState("production-cluster");
  const [refreshInterval, setRefreshInterval] = useState("10");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [currentContext, setCurrentContext] = useState("");

  // AI Copilot Settings
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);

  // Docker Registry Account
  const [dockerAccount, setDockerAccount] = useState<DockerAccount | null>(null);
  const [dockerDialogOpen, setDockerDialogOpen] = useState(false);

  useEffect(() => {
    setClusterName(localStorage.getItem("k8s-cluster-name") || "production-cluster");
    setRefreshInterval(localStorage.getItem("k8s-refresh-interval") || "10");
    setAiSettings(getClientAiSettings());
    setDockerAccount(getStoredDockerAccount());

    apiClient
      .getClusterInfo()
      .then(setClusterInfo)
      .catch(() => {
        // Cluster info unavailable — placeholders are shown instead.
      });
    apiClient
      .getContexts()
      .then((res) => {
        setContexts(res.contexts);
        const stored = typeof window !== "undefined" ? localStorage.getItem("k8s-context") : null;
        setCurrentContext(stored || res.currentContext);
      })
      .catch(() => {
        // Cluster info unavailable — placeholders are shown instead.
      });
  }, []);

  const handleProviderChange = (newProvider: AiProvider) => {
    setAiSettings((prev) => ({
      ...prev,
      provider: newProvider,
      model: MODEL_PRESETS[newProvider][0],
      customEndpoint:
        newProvider === "custom" && !prev.customEndpoint ? "http://localhost:11434/v1" : prev.customEndpoint,
    }));
  };

  const handleTestAiConnection = async () => {
    if (!aiSettings.apiKey && aiSettings.provider !== "custom") {
      toast.error("Please enter an API key before testing");
      return;
    }
    setTestingAi(true);
    try {
      const res = await apiClient.diagnoseWithAi(
        {
          podName: "connection-test-pod",
          namespace: "default",
          container: "test",
          status: "Running",
          userQuery: "Confirm diagnostic copilot connectivity and configuration.",
        },
        aiSettings,
      );
      if (res.isAiGenerated) {
        toast.success(`Connected successfully to ${res.providerUsed}!`);
      } else {
        toast.info(`Engine active: ${res.providerUsed}`);
      }
    } catch (err) {
      toast.error(`Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setTestingAi(false);
    }
  };

  const handleSave = () => {
    setSaveStatus("saving");
    localStorage.setItem("k8s-cluster-name", clusterName);
    localStorage.setItem("k8s-refresh-interval", refreshInterval);
    saveClientAiSettings(aiSettings);

    setTimeout(() => {
      setSaveStatus("saved");
      toast.success("Settings & AI Configuration saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  };

  const handleExport = () => {
    const config = {
      clusterName,
      refreshInterval: Number.parseInt(refreshInterval, 10),
      activeContext: currentContext,
      aiSettings: {
        ...aiSettings,
        // Mask API key for export security
        apiKey: aiSettings.apiKey ? "********" : "",
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "k8s-dashboard-config.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration exported");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Settings2 className="text-primary size-5" />
              Dashboard Settings
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              General dashboard behavior, AI Error Copilot keys, and cluster connection details.
            </CardDescription>
          </div>
          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveStatus !== "idle"}>
              {saveStatus === "saving" ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : saveStatus === "saved" ? (
                <Check className="size-3.5" />
              ) : (
                <Save className="size-3.5" />
              )}
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save Changes"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 py-6">
          {/* General Section */}
          <div className="flex flex-col gap-4">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              General
            </CardTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cluster-name" className="text-xs font-medium">
                  Display name
                </label>
                <Input
                  id="cluster-name"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-muted-foreground text-[10px]">Shown in the header and exports.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="refresh-interval" className="text-xs font-medium">
                  Auto-refresh interval
                </label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger id="refresh-interval" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="0">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-[10px]">
                  How often list views re-fetch live cluster data.
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* AI Copilot & Diagnostics Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                  <Sparkles className="size-3.5 text-indigo-500" />
                  AI Error Diagnostics Copilot
                </CardTitle>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Real-time root cause analysis and remediation suggestions for failed pods, crash loops, and error
                  logs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{aiSettings.enabled ? "Enabled" : "Disabled"}</span>
                <Switch
                  checked={aiSettings.enabled}
                  onCheckedChange={(checked) => setAiSettings((prev) => ({ ...prev, enabled: checked }))}
                  aria-label="Toggle AI Diagnostics"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Provider selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ai-provider" className="text-xs font-medium flex items-center gap-1.5">
                    <Bot className="size-3.5 text-primary" />
                    AI Provider
                  </label>
                  <Select value={aiSettings.provider} onValueChange={(val) => handleProviderChange(val as AiProvider)}>
                    <SelectTrigger id="ai-provider" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="custom">Custom / Local (Ollama, vLLM)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-[10px]">
                    Select the LLM provider for pod failure analysis.
                  </span>
                </div>

                {/* Model selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ai-model" className="text-xs font-medium">
                    Model
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={aiSettings.model}
                      onValueChange={(val) => setAiSettings((prev) => ({ ...prev, model: val }))}
                    >
                      <SelectTrigger id="ai-model" className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_PRESETS[aiSettings.provider]?.map((m) => (
                          <SelectItem key={m} value={m} className="font-mono text-xs">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {aiSettings.provider === "custom" && (
                      <Input
                        placeholder="Custom model"
                        value={aiSettings.model}
                        onChange={(e) => setAiSettings((prev) => ({ ...prev, model: e.target.value }))}
                        className="h-8 text-xs w-36 font-mono"
                      />
                    )}
                  </div>
                  <span className="text-muted-foreground text-[10px]">
                    Preset models optimized for structured diagnostic analysis.
                  </span>
                </div>
              </div>

              {/* API Key input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ai-api-key" className="text-xs font-medium flex items-center gap-1.5">
                  <Key className="size-3.5 text-primary" />
                  API Key
                </label>
                <div className="relative">
                  <Input
                    id="ai-api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder={
                      aiSettings.provider === "openai"
                        ? "sk-proj-..."
                        : aiSettings.provider === "gemini"
                          ? "AIzaSy..."
                          : aiSettings.provider === "anthropic"
                            ? "sk-ant-..."
                            : "Optional for local endpoints"
                    }
                    value={aiSettings.apiKey}
                    onChange={(e) => setAiSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                    className="h-8 pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <span className="text-muted-foreground text-[10px]">
                  Securely stored in your browser session. If no key is configured, the dashboard automatically utilizes
                  its built-in Kubernetes heuristics.
                </span>
              </div>

              {/* Custom endpoint if provider is custom */}
              {aiSettings.provider === "custom" && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ai-endpoint" className="text-xs font-medium">
                    Endpoint URL (OpenAI-compatible)
                  </label>
                  <Input
                    id="ai-endpoint"
                    placeholder="http://localhost:11434/v1"
                    value={aiSettings.customEndpoint || ""}
                    onChange={(e) => setAiSettings((prev) => ({ ...prev, customEndpoint: e.target.value }))}
                    className="h-8 font-mono text-xs"
                  />
                  <span className="text-muted-foreground text-[10px]">
                    Local or on-premise inference server (Ollama, vLLM, LocalAI, LM Studio).
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestAiConnection}
                  disabled={testingAi}
                  className="h-7.5 gap-1.5 text-xs"
                >
                  <RefreshCw className={`size-3.5 ${testingAi ? "animate-spin" : ""}`} />
                  {testingAi ? "Testing..." : "Test Connection"}
                </Button>

                <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                  <span
                    className={`size-1.5 rounded-full ${aiSettings.apiKey || aiSettings.provider === "custom" ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  {aiSettings.apiKey || aiSettings.provider === "custom" ? "Key Configured" : "Heuristics Mode Active"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Docker & Container Registry Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Docker & Container Registries
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDockerDialogOpen(true)}
                className="h-7 text-xs gap-1.5"
              >
                <HardDriveDownload className="size-3.5" />
                {dockerAccount?.isConnected ? "Manage Account" : "Connect Docker Account"}
              </Button>
            </div>

            <div className="bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <div className="border-blue-500/20 bg-blue-500/10 text-blue-600 rounded-lg border p-2">
                  <HardDriveDownload className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">
                      {dockerAccount?.isConnected ? `@${dockerAccount.username}` : "Public Docker Hub (Guest)"}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        dockerAccount?.isConnected
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {dockerAccount?.isConnected ? "Authenticated" : "Public Only"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {dockerAccount?.isConnected
                      ? "Private images can be pulled via automated Kubernetes ImagePullSecrets."
                      : "Connect a Personal Access Token to search private repos and bypass Docker Hub pull rate limits."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" asChild className="h-8 text-xs">
                  <Link href="/dashboard/registry">Open Registry Hub</Link>
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cluster Connection Section */}
          <div className="flex flex-col gap-4">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Cluster Connection
            </CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-muted/20 flex items-start gap-3 rounded-xl border p-3">
                <div className="border-primary/20 bg-primary/10 text-primary rounded-lg border p-2">
                  <Server className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Active context</p>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">
                    {currentContext || "loading..."}
                  </p>
                  <Badge variant="outline" className="mt-1.5 gap-1 border-emerald-500/30 bg-emerald-500/5 text-[10px]">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Connected
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/20 flex items-start gap-3 rounded-xl border p-3">
                <div className="bg-muted text-foreground rounded-lg border p-2">
                  <Info className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Cluster info</p>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    Kubernetes {clusterInfo?.version ?? "-"} • {clusterInfo?.nodes ?? "-"} nodes •{" "}
                    {clusterInfo?.namespaces ?? "-"} namespaces
                  </p>
                  <p className="text-muted-foreground mt-1 text-[10px]">
                    {contexts.length} kubeconfig context{contexts.length === 1 ? "" : "s"} available
                  </p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Switch the active cluster from the context selector in the top header. Theme, layout and sidebar
              preferences live in the toolbar as well.
            </p>
          </div>
        </CardContent>
      </Card>

      <DockerAccountDialog
        open={dockerDialogOpen}
        onOpenChange={setDockerDialogOpen}
        account={dockerAccount}
        onAccountChange={setDockerAccount}
      />
    </div>
  );
}
