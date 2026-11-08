"use client";

import { useCallback, useEffect, useState } from "react";

import { BrainCircuit, Cpu, RefreshCw, Server, Thermometer, Zap } from "lucide-react";
import { toast } from "sonner";

import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AiClusterData, apiClient } from "@/lib/api-client";

export function AiWorkloadsView() {
  const [data, setData] = useState<AiClusterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await apiClient.getAIWorkloads();
      setData(res);
    } catch (err) {
      toast.error(`Failed to fetch AI workloads: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const inventoryCards = data
    ? [
        {
          label: "Total GPUs",
          value: data.inventory.totalGpus,
          sub: `${data.inventory.freeGpus} free`,
          icon: Cpu,
          iconClass: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        },
        {
          label: "Allocated GPUs",
          value: data.inventory.allocatedGpus,
          sub: `${Math.round((data.inventory.allocatedGpus / Math.max(data.inventory.totalGpus, 1)) * 100)}% utilization`,
          icon: Zap,
          iconClass: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        },
        {
          label: "VRAM Pool",
          value: `${data.inventory.allocatedVramGb} / ${data.inventory.totalVramGb} GB`,
          sub: `${data.inventory.gpuUtilizationPct}% GPU utilization`,
          icon: BrainCircuit,
          iconClass: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        },
        {
          label: "GPU Operator",
          value: data.runtime.gpuOperatorStatus,
          sub: `CUDA ${data.runtime.cudaVersion} · driver ${data.runtime.driverVersion}`,
          icon: Server,
          iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
            <BrainCircuit className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI & GPU Workloads</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              LLM inference, fine-tuning and agent serving with GPU fleet telemetry
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Inventory cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : inventoryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {card.label}
                    </CardTitle>
                    <div className={`flex size-8 items-center justify-center rounded-lg border ${card.iconClass}`}>
                      <Icon className="size-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-lg font-bold tracking-tight">{card.value}</div>
                    <p className="text-muted-foreground mt-1 text-xs">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* GPU cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">GPU Fleet</CardTitle>
          <CardDescription>Per-node accelerator health, thermals and power draw</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
              : data?.cards.map((card) => (
                  <div
                    key={`${card.nodeName}-${card.model}`}
                    className="hover:bg-muted/40 rounded-xl border p-4 transition-colors"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-xs font-semibold">{card.model}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        ×{card.count - card.allocatedGpus} free
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 truncate font-mono text-[10px]">{card.nodeName}</p>
                    <div className="space-y-2">
                      <div>
                        <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
                          <span className="flex items-center gap-1">
                            <Thermometer className="size-3" /> Temp
                          </span>
                          <span className="font-mono">{card.temperatureC}°C</span>
                        </div>
                        <Progress value={Math.min(100, (card.temperatureC / 100) * 100)} className="h-1.5" />
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
                          <span>Power</span>
                          <span className="font-mono">
                            {card.powerUsageW}W / {card.powerLimitW}W
                          </span>
                        </div>
                        <Progress value={(card.powerUsageW / Math.max(card.powerLimitW, 1)) * 100} className="h-1.5" />
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
                          <span>VRAM</span>
                          <span className="font-mono">{card.vramPerCardGb} GB/card</span>
                        </div>
                        <Progress value={(card.allocatedGpus / Math.max(card.count, 1)) * 100} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>

      {/* Workloads table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Workloads</CardTitle>
          <CardDescription>Inference endpoints, embedding services and distributed training jobs</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Workload</TableHead>
                <TableHead className="py-3 font-normal">Namespace</TableHead>
                <TableHead className="py-3 font-normal">Framework</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Model</TableHead>
                <TableHead className="py-3 font-normal">Replicas / GPUs</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Throughput</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">P95 Latency</TableHead>
                <TableHead className="py-3 font-normal">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground h-12 text-xs">
                    Loading AI workloads...
                  </TableCell>
                </TableRow>
              ) : !data || data.workloads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground h-20 text-center text-xs">
                    <BrainCircuit className="mx-auto mb-1.5 size-5 opacity-50" />
                    No AI workloads deployed
                  </TableCell>
                </TableRow>
              ) : (
                data.workloads.map((w) => (
                  <TableRow key={w.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold">{w.name}</p>
                        <p className="text-muted-foreground text-[10px]">{w.taskType}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {w.namespace}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{w.framework}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate font-mono text-xs md:table-cell">
                      {w.modelName}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {w.replicas} / {w.gpusAllocated} GPU
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">
                      {w.throughputTokensPerSec ? `${w.throughputTokensPerSec} tok/s` : "-"}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs lg:table-cell">
                      {w.p95LatencyMs ? `${w.p95LatencyMs} ms` : "-"}
                    </TableCell>
                    <TableCell>
                      <ResourceStatusBadge status={w.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
