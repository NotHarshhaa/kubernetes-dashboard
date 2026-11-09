"use client";

import { Check, Copy, Download, FileCode2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";

interface YamlViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceKind: string;
  resourceName: string;
  namespace?: string;
  rawYaml?: string;
}

export function YamlViewerDialog({
  open,
  onOpenChange,
  resourceKind,
  resourceName,
  namespace = "default",
  rawYaml,
}: YamlViewerDialogProps) {
  const [yamlContent, setYamlContent] = useState<string>(rawYaml ?? "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (rawYaml) {
      setYamlContent(rawYaml);
      return;
    }

    if (open && resourceKind && resourceName) {
      setLoading(true);
      apiClient
        .getResourceYaml(resourceKind, resourceName, namespace)
        .then((yaml) => setYamlContent(yaml))
        .catch((err) => toast.error(`Failed to load manifest: ${err instanceof Error ? err.message : "Error"}`))
        .finally(() => setLoading(false));
    }
  }, [open, resourceKind, resourceName, namespace, rawYaml]);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    toast.success("YAML manifest copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resourceKind.toLowerCase()}-${resourceName}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("YAML file downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col p-5 sm:max-w-3xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <FileCode2 className="text-primary size-4.5" />
                <span>Resource Manifest:</span>
                <span className="text-primary font-mono">{resourceName}</span>
              </DialogTitle>
              <DialogDescription className="mt-0.5 flex items-center gap-2 text-xs">
                <Badge variant="outline" className="h-4.5 px-1.5 font-mono text-[10px]">
                  {resourceKind}
                </Badge>
                {namespace && (
                  <span>
                    Namespace: <strong className="text-foreground font-mono">{namespace}</strong>
                  </span>
                )}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5">
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

        <div className="mt-3 max-h-[50vh] min-h-[320px] flex-1 overflow-hidden rounded-xl border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 shadow-inner">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-xs">Fetching resource manifest...</p>
            </div>
          ) : (
            <pre className="h-full w-full overflow-auto font-mono leading-relaxed whitespace-pre-wrap text-zinc-200 select-text">
              {yamlContent}
            </pre>
          )}
        </div>

        <Separator className="mt-3" />
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7.5 text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
