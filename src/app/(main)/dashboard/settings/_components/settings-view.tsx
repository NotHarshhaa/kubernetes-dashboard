"use client";

import { Check, Download, Info, RefreshCw, Save, Server, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiClient, type ClusterInfo, type ContextItem } from "@/lib/api-client";

type SaveStatus = "idle" | "saving" | "saved";

export function SettingsView() {
  const [clusterName, setClusterName] = useState("production-cluster");
  const [refreshInterval, setRefreshInterval] = useState("10");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [currentContext, setCurrentContext] = useState("");

  useEffect(() => {
    setClusterName(localStorage.getItem("k8s-cluster-name") || "production-cluster");
    setRefreshInterval(localStorage.getItem("k8s-refresh-interval") || "10");

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

  const handleSave = () => {
    setSaveStatus("saving");
    localStorage.setItem("k8s-cluster-name", clusterName);
    localStorage.setItem("k8s-refresh-interval", refreshInterval);
    setTimeout(() => {
      setSaveStatus("saved");
      toast.success("Dashboard settings saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
  };

  const handleExport = () => {
    const config = {
      clusterName,
      refreshInterval: Number.parseInt(refreshInterval, 10),
      activeContext: currentContext,
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
              General dashboard behavior and cluster connection details.
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
    </div>
  );
}
