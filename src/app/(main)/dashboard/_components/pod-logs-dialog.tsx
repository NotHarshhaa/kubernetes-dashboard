"use client";

import { Check, Copy, Download, RefreshCw, Search, Sparkles, Terminal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AiDiagnosticsDialog } from "@/app/(main)/dashboard/_components/ai-diagnostics-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";

interface PodLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podName: string;
  namespace: string;
  containers?: { name: string; image?: string }[];
}

export function PodLogsDialog({ open, onOpenChange, podName, namespace, containers = [] }: PodLogsDialogProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>(containers[0]?.name ?? "");
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAiDiag, setShowAiDiag] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name);
    }
  }, [containers, selectedContainer]);

  const fetchLogs = useCallback(async () => {
    if (!podName || !namespace) return;
    try {
      setLoading(true);
      const text = await apiClient.getPodLogs(namespace, podName, selectedContainer);
      setLogs(text);
    } catch (err) {
      toast.error(`Failed to fetch logs: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [podName, namespace, selectedContainer]);

  useEffect(() => {
    if (open) {
      void fetchLogs();
    }
  }, [open, fetchLogs]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (open && autoRefresh) {
      interval = setInterval(fetchLogs, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, autoRefresh, fetchLogs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    toast.success("Logs copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([logs], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${namespace}-${podName}-${selectedContainer || "main"}.log`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log file downloaded");
  };

  const filteredLogs = logs
    .split("\n")
    .filter((line) => (filterQuery ? line.toLowerCase().includes(filterQuery.toLowerCase()) : true))
    .join("\n");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col p-5 sm:max-w-4xl">
          <DialogHeader className="border-b pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Terminal className="text-primary size-4.5" />
                  <span>Live Pod Logs:</span>
                  <span className="text-primary font-mono">{podName}</span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-xs">
                  <span>
                    Namespace: <strong className="text-foreground font-mono">{namespace}</strong>
                  </span>
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/30 bg-emerald-500/5 px-2 py-0 text-[10px]"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live Stream
                  </Badge>
                </DialogDescription>
              </div>

              {containers.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Container:</span>
                  <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                    <SelectTrigger className="h-8.5 w-36 text-xs">
                      <SelectValue placeholder="Select container" />
                    </SelectTrigger>
                    <SelectContent>
                      {containers.map((c) => (
                        <SelectItem key={c.name} value={c.name} className="font-mono text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
              <div className="relative max-w-sm min-w-[200px] flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Filter output log lines..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="h-8 pl-8 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiDiag(true)}
                  className="h-8 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                >
                  <Sparkles className="mr-1.5 size-3.5 text-indigo-500" />
                  Diagnose with AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="h-8 px-2.5 text-xs"
                >
                  <RefreshCw className={`mr-1.5 size-3.5 ${autoRefresh || loading ? "animate-spin" : ""}`} />
                  {autoRefresh ? "Streaming" : "Follow"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 px-2.5 text-xs">
                  {copied ? <Check className="mr-1 size-3.5 text-emerald-500" /> : <Copy className="mr-1 size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 px-2.5 text-xs">
                  <Download className="mr-1 size-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-3 flex max-h-[50vh] min-h-[350px] flex-1 flex-col overflow-hidden rounded-xl border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 shadow-inner">
            <div ref={scrollRef} className="h-full w-full flex-1 overflow-auto pr-2">
              {filteredLogs.trim() ? (
                <pre className="font-mono leading-relaxed break-all whitespace-pre-wrap text-zinc-200 select-text">
                  {filteredLogs}
                </pre>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-zinc-500">
                  <Terminal className="size-6 animate-pulse text-zinc-400" />
                  <p className="text-xs">
                    {filterQuery ? "No log lines match filter." : "Waiting for live stdout/stderr log output..."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="mt-3" />
          <div className="text-muted-foreground flex items-center justify-between pt-2 text-xs">
            <div>
              Showing{" "}
              <strong className="text-foreground font-mono">{filteredLogs.split("\n").filter(Boolean).length}</strong>{" "}
              log lines
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7.5 text-xs">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AiDiagnosticsDialog
        open={showAiDiag}
        onOpenChange={setShowAiDiag}
        request={{
          podName,
          namespace,
          container: selectedContainer,
          logs: filteredLogs || logs,
        }}
      />
    </>
  );
}
