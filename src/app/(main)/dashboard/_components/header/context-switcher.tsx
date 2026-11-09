"use client";

import { cn } from "cn";
import { Loader2, Server } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient, type ContextItem } from "@/lib/api-client";

export function ContextSwitcher() {
  const [contexts, setContexts] = React.useState<ContextItem[]>([]);
  const [currentContext, setCurrentContext] = React.useState<string>("");
  const [switchingContext, setSwitchingContext] = React.useState(false);

  React.useEffect(() => {
    apiClient
      .getContexts()
      .then((res) => {
        setContexts(res.contexts);
        const stored = typeof window !== "undefined" ? localStorage.getItem("k8s-context") : null;
        setCurrentContext(stored || res.currentContext);
      })
      .catch(() => {
        // No kubeconfig available — the UI falls back to placeholder state.
      });
  }, []);

  const handleContextChange = async (newContext: string) => {
    if (newContext === currentContext || switchingContext) return;
    try {
      setSwitchingContext(true);
      await apiClient.switchContext(newContext);
      setCurrentContext(newContext);
      toast.success(`Switched active cluster to ${newContext}`);
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      toast.error("Failed to switch cluster context");
    } finally {
      setSwitchingContext(false);
    }
  };

  const active = contexts.find((c) => c.name === currentContext);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={switchingContext}
        className={cn(
          "border-input bg-background hover:bg-muted/50 flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium shadow-none transition-colors",
          "max-w-[220px] md:max-w-none",
        )}
      >
        {switchingContext ? (
          <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
        ) : (
          <Server className="text-primary size-3.5 shrink-0" />
        )}
        <span className="truncate font-mono">{currentContext || "Cluster Context"}</span>
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500/80 dark:bg-emerald-400/80" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
          KubeConfig Clusters
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {contexts.map((ctx) => (
          <DropdownMenuItem
            key={ctx.name}
            onClick={() => handleContextChange(ctx.name)}
            className={cn("gap-2", ctx.name === currentContext && "bg-accent")}
          >
            <span
              className={cn(
                "mt-0.5 size-2 shrink-0 rounded-full",
                ctx.name === currentContext ? "bg-emerald-500" : "bg-muted-foreground/30",
              )}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-mono text-xs font-semibold">{ctx.name}</span>
              <span className="text-muted-foreground truncate text-[10px]">{ctx.cluster}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {active?.namespace && <DropdownMenuSeparator />}
        <div className="text-muted-foreground px-2 py-1.5 text-[10px]">
          {active ? `Namespace: ${active.namespace}` : "No kubeconfig contexts available"}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
