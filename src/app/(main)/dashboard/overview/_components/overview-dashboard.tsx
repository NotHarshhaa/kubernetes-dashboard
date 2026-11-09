"use client";

import { ArrowUpRight, Container, Layers, Network, RefreshCw, Server, Shield } from "lucide-react";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ActivityFeed } from "@/app/(main)/dashboard/_components/activity-feed";
import { QuickActions } from "@/app/(main)/dashboard/_components/quick-actions";
import { ResourceCharts } from "@/app/(main)/dashboard/_components/resource-charts";
import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type ClusterInfo, type Node, type Pod, type Service } from "@/lib/api-client";

export function OverviewDashboard() {
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [pods, setPods] = useState<Pod[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [info, podsData, nodesData, servicesData] = await Promise.all([
        apiClient.getClusterInfo(),
        apiClient.getPods(),
        apiClient.getNodes(),
        apiClient.getServices(),
      ]);

      setClusterInfo(info);
      setPods(podsData);
      setNodes(nodesData);
      setServices(servicesData);
      setIsDemoMode(info.name === "demo-cluster");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cluster data");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const runningPodsCount = pods.filter((p) => p.status === "Running").length;
  const readyNodesCount = nodes.filter((n) => n.status === "Ready").length;

  const metricCards = [
    {
      title: "Compute Nodes",
      value: clusterInfo?.nodes ?? nodes.length,
      badge: `${readyNodesCount} Schedulable`,
      description: "32 core compute pool",
      icon: Server,
      iconClass: "border-sky-500/20 bg-sky-500/10 text-sky-500",
    },
    {
      title: "Container Pods",
      value: clusterInfo?.pods ?? pods.length,
      badge: `${runningPodsCount} Running`,
      description: "Across all namespace zones",
      icon: Container,
      iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Network Services",
      value: clusterInfo?.services ?? services.length,
      badge: "Ingress Ready",
      description: "ClusterIP & LoadBalancers",
      icon: Network,
      iconClass: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    },
    {
      title: "Namespaces",
      value: clusterInfo?.namespaces ?? 4,
      badge: "Isolated",
      description: "RBAC boundary partitions",
      icon: Layers,
      iconClass: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    },
  ];

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <Shield className="text-destructive size-8" />
          <p className="font-semibold">Failed to reach cluster</p>
          <p className="text-muted-foreground text-xs">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
            <RefreshCw className="mr-2 size-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header banner */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="border-primary/20 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border">
            <Shield className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Cluster Overview</h1>
              {isDemoMode && (
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  Demo Environment
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Kubernetes {clusterInfo?.version ?? "v1.28.2"} • {nodes.length || 4} active nodes • {runningPodsCount}/
              {pods.length || 8} healthy pods running
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh State
        </Button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title} className="hover:border-primary/40 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {metric.title}
                    </CardTitle>
                    <div className={`flex size-8 items-center justify-center rounded-lg border ${metric.iconClass}`}>
                      <Icon className="size-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="font-mono text-2xl font-bold tracking-tight">{metric.value}</div>
                      <Badge variant="outline" className="h-4.5 px-1.5 text-[10px] font-semibold">
                        {metric.badge}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-xs">{metric.description}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <QuickActions />

      <ResourceCharts />

      {/* Recent pods + activity stream */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Container className="text-primary size-4" />
                Active Pods
              </CardTitle>
              <CardDescription>Latest container runtime status and host nodes</CardDescription>
            </div>
            <CardAction>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/dashboard/pods">
                  View All <ArrowUpRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
              ) : pods.length === 0 ? (
                <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
                  No pods reported by the cluster
                </div>
              ) : (
                pods.slice(0, 5).map((pod, idx) => (
                  <div
                    key={`${pod.namespace}-${pod.name}-${pod.node || idx}`}
                    className="bg-card/60 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted text-foreground rounded-lg border p-2">
                        <Container className="text-primary size-4" />
                      </div>
                      <div>
                        <p className="text-foreground font-mono text-xs font-semibold">{pod.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Badge variant="outline" className="h-4 px-1.5 font-mono text-[10px]">
                            {pod.namespace}
                          </Badge>
                          <span className="text-muted-foreground font-mono text-[11px]">Node: {pod.node}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ResourceStatusBadge status={pod.status} />
                      <span className="text-muted-foreground hidden font-mono text-xs sm:inline">{pod.ip}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>
    </div>
  );
}
