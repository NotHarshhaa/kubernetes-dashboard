"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { Container, RefreshCw, Terminal } from "lucide-react";

const XtermTerminal = dynamic(() => import("./xterm-terminal").then((m) => m.XtermTerminal), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-950 font-mono text-sm text-slate-500">
      <RefreshCw className="text-primary size-6 animate-spin" />
      <span>Initializing interactive container terminal...</span>
    </div>
  ),
});

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PodExecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podName: string;
  namespace: string;
  containers?: { name: string; image?: string }[];
}

export function PodExecDialog({ open, onOpenChange, podName, namespace, containers = [] }: PodExecDialogProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>(containers[0]?.name ?? "main");

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name);
    }
  }, [containers, selectedContainer]);

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
        podName,
        namespace,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border p-0 sm:max-w-4xl">
        <DialogHeader className="bg-muted/20 border-b p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Terminal className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                  <span>Exec: {podName}</span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {namespace}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">Interactive ANSI container terminal session</DialogDescription>
              </div>
            </div>

            {/* Container Selector */}
            {containers.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Container className="text-primary size-3.5" /> Container:
                </span>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger className="h-7.5 w-[140px] text-xs">
                    <SelectValue placeholder="Container" />
                  </SelectTrigger>
                  <SelectContent>
                    {containers.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="bg-background p-4">
          {open && (
            <XtermTerminal
              key={`${namespace}-${podName}-${selectedContainer}`}
              podName={podName}
              namespace={namespace}
              container={selectedContainer}
              onExecuteCommand={handleExecuteCommand}
              height="450px"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
