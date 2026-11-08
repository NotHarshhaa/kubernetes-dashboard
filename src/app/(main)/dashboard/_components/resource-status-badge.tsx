import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

type StatusTone = "running" | "pending" | "failed" | "unknown" | "succeeded";

const toneMeta: Record<StatusTone, { label: string; dotClass: string; badgeClass: string }> = {
  running: {
    label: "Running",
    dotClass: "bg-emerald-500 animate-pulse",
    badgeClass: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  },
  succeeded: {
    label: "Succeeded",
    dotClass: "bg-emerald-500",
    badgeClass: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    dotClass: "bg-amber-500 animate-pulse",
    badgeClass: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-rose-500",
    badgeClass: "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-muted-foreground/40",
    badgeClass: "text-muted-foreground",
  },
};

const STATUS_ALIASES: Record<string, StatusTone> = {
  running: "running",
  ready: "running",
  active: "running",
  available: "running",
  programmed: "running",
  accepted: "running",
  succeeded: "succeeded",
  complete: "succeeded",
  bound: "succeeded",
  pending: "pending",
  reconciling: "pending",
  containercreating: "pending",
  terminated: "pending",
  failed: "failed",
  error: "failed",
  crashloopbackoff: "failed",
  imagepullbackoff: "failed",
  notready: "failed",
  outofsync: "failed",
  degraded: "failed",
  evicted: "failed",
  unknown: "unknown",
  sync: "unknown",
};

export function ResourceStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_ALIASES[status.toLowerCase()] ?? "unknown";
  const meta = toneMeta[tone];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-0.5 font-medium", meta.badgeClass, className)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}
