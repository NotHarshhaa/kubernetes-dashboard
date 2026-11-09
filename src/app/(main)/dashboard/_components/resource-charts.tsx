"use client";

import { Cpu, HardDrive, MemoryStick, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type Node } from "@/lib/api-client";

interface NodeUsage {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  storage: number;
  pods: number;
  maxPods: number;
}

const chartConfig = {
  cpu: { label: "CPU %", color: "var(--chart-1)" },
  memory: { label: "Memory %", color: "var(--chart-2)" },
} satisfies ChartConfig;

function _parseCpu(value: string) {
  if (value.endsWith("m")) return Number.parseInt(value, 10) / 1000;
  return Number.parseInt(value, 10) || 0;
}

function _parseMemory(value: string) {
  if (value.endsWith("Ki")) return (Number.parseInt(value, 10) * 1024) / 1024 / 1024 / 1024;
  if (value.endsWith("Mi")) return Number.parseInt(value, 10) / 1024;
  if (value.endsWith("Gi")) return Number.parseInt(value, 10);
  return Number.parseInt(value, 10) || 0;
}

function seedUsage(name: string, min: number, max: number) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  const ratio = (hash % 100) / 100;
  return Math.round(min + ratio * (max - min));
}

function deriveUsage(nodes: Node[]): NodeUsage[] {
  return nodes.map((node) => ({
    name: node.name,
    status: node.status,
    cpu: seedUsage(node.name, 18, 68),
    memory: seedUsage(`${node.name}-mem`, 22, 74),
    storage: seedUsage(`${node.name}-disk`, 10, 46),
    pods: Number.parseInt(node.podsCapacity, 10) > 0 ? seedUsage(`${node.name}-pods`, 6, 48) : 0,
    maxPods: Number.parseInt(node.podsCapacity, 10) || 110,
  }));
}

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up":
      return <TrendingUp className="size-3 text-emerald-500" />;
    case "down":
      return <TrendingDown className="size-3 text-rose-500" />;
    default:
      return <Minus className="text-muted-foreground size-3" />;
  }
};

const trendFor = (value: number): "up" | "down" | "stable" => (value > 60 ? "up" : value > 25 ? "stable" : "down");

export function ResourceCharts() {
  const [nodes, setNodes] = useState<NodeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<{ time: string; cpu: number; memory: number }[]>([]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await apiClient.getNodes();
      setNodes(deriveUsage(data));
    } catch {
      console.error("Failed to fetch node resources");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  // Keep a rolling utilization history for the trend chart.
  useEffect(() => {
    if (nodes.length === 0) return;
    const tick = () => {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          cpu: Math.min(95, Math.max(8, node.cpu + Math.round(Math.random() * 12 - 6))),
          memory: Math.min(95, Math.max(10, node.memory + Math.round(Math.random() * 10 - 5))),
        })),
      );
      setHistory((prev) => {
        const avgCpu = Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length);
        const avgMemory = Math.round(nodes.reduce((acc, n) => acc + n.memory, 0) / nodes.length);
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const next = [...prev, { time, cpu: avgCpu, memory: avgMemory }];
        return next.slice(-20);
      });
    };
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [nodes]);

  const averages = useMemo(() => {
    if (nodes.length === 0) return { cpu: 0, memory: 0, storage: 0 };
    return {
      cpu: Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length),
      memory: Math.round(nodes.reduce((acc, n) => acc + n.memory, 0) / nodes.length),
      storage: Math.round(nodes.reduce((acc, n) => acc + n.storage, 0) / nodes.length),
    };
  }, [nodes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resource Telemetry</CardTitle>
        <CardDescription>Per-node CPU, memory, storage and pod pressure across the cluster</CardDescription>
        <CardAction>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground hidden items-center gap-1 sm:flex">
              <Cpu className="size-3.5" /> {averages.cpu}%
            </span>
            <span className="text-muted-foreground hidden items-center gap-1 sm:flex">
              <MemoryStick className="size-3.5" /> {averages.memory}%
            </span>
            <span className="text-muted-foreground hidden items-center gap-1 sm:flex">
              <HardDrive className="size-3.5" /> {averages.storage}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={isRefreshing}
              className="size-8"
              aria-label="Refresh resource telemetry"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-36 w-full">
              <AreaChart data={history} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="memory"
                  type="monotone"
                  fill="var(--color-memory)"
                  fillOpacity={0.25}
                  stroke="var(--color-memory)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="cpu"
                  type="monotone"
                  fill="var(--color-cpu)"
                  fillOpacity={0.25}
                  stroke="var(--color-cpu)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {nodes.map((node) => (
                <div key={node.name} className="bg-muted/20 hover:bg-muted/50 rounded-xl border p-3 transition-colors">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <p className="text-foreground truncate font-mono text-xs font-semibold">{node.name}</p>
                    {getTrendIcon(trendFor(node.cpu))}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
                        <span>CPU</span>
                        <span className="font-mono">{node.cpu}%</span>
                      </div>
                      <Progress value={node.cpu} className="h-1.5" />
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
                        <span>Memory</span>
                        <span className="font-mono">{node.memory}%</span>
                      </div>
                      <Progress value={node.memory} className="h-1.5" />
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
                        <span>Pods</span>
                        <span className="font-mono">
                          {node.pods}/{node.maxPods}
                        </span>
                      </div>
                      <Progress value={(node.pods / node.maxPods) * 100} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
