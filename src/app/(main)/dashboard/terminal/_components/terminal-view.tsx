"use client";

import { useCallback, useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { RefreshCw, SquareTerminal } from "lucide-react";
import { toast } from "sonner";

import { XtermTerminal } from "@/app/(main)/dashboard/_components/xterm-terminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type Pod } from "@/lib/api-client";

// xterm needs the canvas DOM — never render on the server.
const XtermTerminalLazy = dynamic(() => Promise.resolve(XtermTerminal), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-950 font-mono text-sm text-slate-500">
      <RefreshCw className="text-primary size-6 animate-spin" />
      <span>Initializing xterm.js PTY session...</span>
    </div>
  ),
});

export function TerminalView() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodName, setSelectedPodName] = useState<string>("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default");
  const [selectedContainer, setSelectedContainer] = useState<string>("main");

  const fetchPods = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPods();
      setPods(data);
      if (data.length > 0 && !selectedPodName) {
        const firstRunning = data.find((p) => p.status === "Running") || data[0];
        setSelectedPodName(firstRunning.name);
        setSelectedNamespace(firstRunning.namespace);
        setSelectedContainer(firstRunning.containers?.[0]?.name || "main");
      }
    } catch (err) {
      toast.error(`Failed to fetch pods: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setLoading(false);
    }
  }, [selectedPodName]);

  useEffect(() => {
    void fetchPods();
  }, [fetchPods]);

  const selectedPod = pods.find((p) => p.name === selectedPodName && p.namespace === selectedNamespace);

  const handleExecuteCommand = async (command: string) => {
    const contextHeader: Record<string, string> =
      typeof window !== "undefined" && localStorage.getItem("k8s-context")
        ? { "x-k8s-context": localStorage.getItem("k8s-context") as string }
        : {};

    const res = await fetch("/api/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...contextHeader,
      },
      body: JSON.stringify({
        podName: selectedPodName,
        namespace: selectedNamespace,
        container: selectedContainer,
        command,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    return res.json();
  };

  const handlePodChange = (podName: string) => {
    const pod = pods.find((p) => p.name === podName);
    setSelectedPodName(podName);
    if (pod) {
      setSelectedNamespace(pod.namespace);
      setSelectedContainer(pod.containers?.[0]?.name || "main");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="border-primary/20 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border">
            <SquareTerminal className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Kubernetes Web Terminal</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              High-performance ANSI xterm.js container execution and live shell diagnostics
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchPods} disabled={loading}>
          <RefreshCw className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Pods
        </Button>
      </div>

      {/* Pod & target selector bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Session Target</CardTitle>
          <CardDescription className="text-xs">
            Choose the pod and container to attach the interactive shell to
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Pod</span>
                <Select value={selectedPodName} onValueChange={handlePodChange}>
                  <SelectTrigger className="h-9 font-mono text-xs">
                    <SelectValue placeholder="Select pod" />
                  </SelectTrigger>
                  <SelectContent>
                    {pods.map((p) => (
                      <SelectItem key={`${p.namespace}-${p.name}`} value={p.name} className="font-mono text-xs">
                        {p.name}
                        <span className="text-muted-foreground ml-2 text-[10px]">{p.namespace}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Namespace
                </span>
                <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                  <SelectTrigger className="h-9 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(pods.map((p) => p.namespace))).map((ns) => (
                      <SelectItem key={ns} value={ns} className="font-mono text-xs">
                        {ns}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Container
                </span>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger className="h-9 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedPod?.containers || [{ name: "main" }]).map((c) => (
                      <SelectItem key={c.name} value={c.name} className="font-mono text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Terminal */}
      {selectedPodName ? (
        <XtermTerminalLazy
          key={`${selectedNamespace}-${selectedPodName}-${selectedContainer}`}
          podName={selectedPodName}
          namespace={selectedNamespace}
          container={selectedContainer}
          onExecuteCommand={handleExecuteCommand}
          height="480px"
        />
      ) : (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-xs">
            <SquareTerminal className="size-6 opacity-50" />
            No pods available for a terminal session
          </CardContent>
        </Card>
      )}
    </div>
  );
}
