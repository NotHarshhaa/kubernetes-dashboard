"use client";

import { AlertTriangle, ArrowRight, Database, RefreshCw, Shield, Terminal, Zap } from "lucide-react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  loading?: boolean;
}

async function postAction(action: string, params?: Record<string, string>) {
  const res = await fetch("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  return res.json();
}

export function QuickActions() {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const runApiAction = async (
    id: string,
    action: string,
    params?: Record<string, string>,
    fallbackError = "Action failed",
  ) => {
    setLoadingIds((prev) => [...prev, id]);
    try {
      const result = await postAction(action, params);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message || fallbackError);
      }
    } catch {
      toast.error(fallbackError);
    } finally {
      setLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  };

  const actions: QuickAction[] = [
    {
      id: "restart-deployment",
      title: "Restart Deployment",
      description: "Trigger zero-downtime rolling restart",
      icon: RefreshCw,
      action: () =>
        runApiAction(
          "restart-deployment",
          "restart-deployment",
          { deployment: "frontend-app" },
          "Failed to restart deployment",
        ),
    },
    {
      id: "scale-deployment",
      title: "Scale Workloads",
      description: "Scale deployment and statefulset replicas",
      icon: Zap,
      action: () => router.push("/dashboard/workloads"),
    },
    {
      id: "view-logs",
      title: "Stream Logs",
      description: "Access live pod stdout / stderr logs",
      icon: Terminal,
      action: () => router.push("/dashboard/pods"),
    },
    {
      id: "backup-cluster",
      title: "Backup State",
      description: "Export cluster manifest snapshot",
      icon: Database,
      action: () => runApiAction("backup-cluster", "backup-cluster", undefined, "Failed to backup cluster"),
    },
    {
      id: "security-scan",
      title: "Security Audit",
      description: "Inspect RBAC & container policies",
      icon: Shield,
      action: () => runApiAction("security-scan", "security-scan", undefined, "Failed to run security scan"),
    },
    {
      id: "cleanup-resources",
      title: "Prune Resources",
      description: "Clean completed jobs & evicted pods",
      icon: AlertTriangle,
      action: () => runApiAction("cleanup-resources", "cleanup-resources", undefined, "Failed to cleanup resources"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="size-4 text-amber-500" />
          Quick Actions
        </CardTitle>
        <CardDescription>Rapid operational tasks and cluster automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingIds.includes(action.id);
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.action}
                disabled={isLoading}
                className="group hover:border-primary/40 hover:bg-muted/40 bg-card/60 relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:shadow-xs disabled:opacity-70"
              >
                <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground shrink-0 rounded-lg p-2.5 transition-colors duration-200">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="text-foreground group-hover:text-primary mb-0.5 text-xs font-semibold transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-tight">{action.description}</p>
                  {isLoading && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="border-primary size-3 animate-spin rounded-full border-2 border-t-transparent" />
                      <span className="text-muted-foreground text-[10px]">Executing...</span>
                    </div>
                  )}
                </div>
                <ArrowRight className="text-muted-foreground/40 group-hover:text-primary absolute top-1/2 right-3 size-3.5 -translate-y-1/2 transition-all group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
