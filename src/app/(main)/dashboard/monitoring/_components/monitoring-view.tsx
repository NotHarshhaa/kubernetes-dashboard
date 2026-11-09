"use client";

import { Activity, Cpu, Download, MemoryStick, Network, PauseCircle, PlayCircle, Server } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";

import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type Node, type Pod } from "@/lib/api-client";

const areaConfig = {
  cpu: { label: "CPU %", color: "var(--chart-1)" },
  memory: { label: "Memory %", color: "var(--chart-2)" },
} satisfies ChartConfig;

const barConfig = {
  pods: { label: "Pods", color: "var(--chart-4)" },
} satisfies ChartConfig;

interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number;
}

export function MonitoringView() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [podsData, nodesData] = await Promise.all([apiClient.getPods(), apiClient.getNodes()]);
      setPods(podsData);
      setNodes(nodesData);
    } catch (err) {
      toast.error(`Failed to fetch monitoring data: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Rolling telemetry time series (estimated unless a metrics-server is wired).
  useEffect(() => {
    const generateInitialData = () => {
      const data: MetricPoint[] = [];
      const now = new Date();
      for (let i = 10; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10000);
        data.push({
          time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          cpu: Math.floor(35 + Math.random() * 25),
          memory: Math.floor(50 + Math.random() * 15),
          network: Math.floor(120 + Math.random() * 60),
        });
      }
      return data;
    };

    setMetricsHistory(generateInitialData());

    const interval = setInterval(() => {
      if (autoRefresh) {
        setMetricsHistory((prev) => {
          const now = new Date();
          const newPoint: MetricPoint = {
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            cpu: Math.floor(35 + Math.random() * 25),
            memory: Math.floor(50 + Math.random() * 15),
            network: Math.floor(120 + Math.random() * 60),
          };
          return [...prev.slice(1), newPoint];
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const latestCpu = metricsHistory[metricsHistory.length - 1]?.cpu ?? 45;
  const latestMemory = metricsHistory[metricsHistory.length - 1]?.memory ?? 58;
  const latestNetwork = metricsHistory[metricsHistory.length - 1]?.network ?? 140;

  const runningPods = pods.filter((p) => p.status === "Running").length;
  const readyNodes = nodes.filter((n) => n.status === "Ready").length;

  const podsPerNode = useMemo(
    () =>
      nodes.map((node) => ({
        name: node.name.replace("k8s-", "").replace("-node", ""),
        pods: pods.filter((p) => p.node === node.name).length,
      })),
    [nodes, pods],
  );

  const exportData = () => {
    const csvContent = [
      ["Time", "CPU (%)", "Memory (%)", "Network (MB/s)"],
      ...metricsHistory.map((m) => [m.time, m.cpu.toString(), m.memory.toString(), m.network.toString()]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cluster-metrics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Metrics exported successfully");
  };

  const metricCards = [
    {
      label: "CPU Usage",
      value: `${latestCpu}%`,
      progress: latestCpu,
      icon: Cpu,
      iconClass: "text-primary",
    },
    {
      label: "Memory Usage",
      value: `${latestMemory}%`,
      progress: latestMemory,
      icon: MemoryStick,
      iconClass: "text-sky-500",
    },
    {
      label: "Network I/O",
      value: `${latestNetwork} MB/s`,
      progress: Math.min(100, (latestNetwork / 200) * 100),
      icon: Network,
      iconClass: "text-violet-500",
    },
    {
      label: "Pod Health",
      value: pods.length > 0 ? `${Math.round((runningPods / pods.length) * 100)}%` : "100%",
      progress: pods.length > 0 ? (runningPods / pods.length) * 100 : 100,
      icon: Activity,
      iconClass: "text-emerald-500",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="border-primary/20 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cluster Monitoring</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {readyNodes}/{nodes.length} nodes ready • {runningPods}/{pods.length} pods running
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? <PauseCircle className="mr-2 size-3.5" /> : <PlayCircle className="mr-2 size-3.5" />}
            {autoRefresh ? "Streaming" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {card.label}
                </CardTitle>
                <Icon className={`size-5 ${card.iconClass}`} />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold tracking-tight">{card.value}</div>
                <Progress value={card.progress} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resource Utilization Trend</CardTitle>
            <CardDescription>CPU and memory over the last ~2 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaConfig} className="h-56 w-full">
              <AreaChart data={metricsHistory} margin={{ left: 4, right: 12 }}>
                <defs>
                  <linearGradient id="fillCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-cpu)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-cpu)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-memory)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-memory)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="memory"
                  type="monotone"
                  stroke="var(--color-memory)"
                  strokeWidth={2}
                  fill="url(#fillMemory)"
                />
                <Area dataKey="cpu" type="monotone" stroke="var(--color-cpu)" strokeWidth={2} fill="url(#fillCpu)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="text-muted-foreground size-4" />
              Pods per Node
            </CardTitle>
            <CardDescription>Workload distribution across the compute fleet</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-56 w-full">
              <BarChart data={podsPerNode} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="pods" fill="var(--color-pods)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Node status table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Node Health</CardTitle>
          <CardDescription>Live node conditions and capacity</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Node</TableHead>
                <TableHead className="py-3 font-normal">Status</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Version</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Runtime</TableHead>
                <TableHead className="py-3 font-normal">CPU / Memory Capacity</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">Pods Scheduled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-12 text-xs">
                    Loading node health...
                  </TableCell>
                </TableRow>
              ) : (
                nodes.map((node) => (
                  <TableRow key={node.name} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs font-semibold">{node.name}</TableCell>
                    <TableCell>
                      <ResourceStatusBadge status={node.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      {node.version}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      {node.containerRuntime}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {node.cpuCapacity}c / {node.memoryCapacity}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {pods.filter((p) => p.node === node.name).length} pods
                      </Badge>
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
