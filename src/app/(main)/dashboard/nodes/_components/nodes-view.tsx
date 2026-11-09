"use client";

import {
  Cpu,
  EllipsisVertical,
  HardDrive,
  MemoryStick,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type Node } from "@/lib/api-client";

export function NodesView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchNodes = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getNodes();
      setNodes(data);
    } catch (err) {
      toast.error(`Failed to fetch nodes: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void fetchNodes();
  }, [fetchNodes]);

  const filtered = nodes.filter((n) => !search || n.name.toLowerCase().includes(search.toLowerCase()));

  const handleCordon = async (node: Node, cordon: boolean) => {
    try {
      await apiClient.cordonNode(node.name, cordon);
      toast.success(cordon ? `Node ${node.name} cordoned` : `Node ${node.name} uncordoned`);
      await fetchNodes();
    } catch (err) {
      toast.error(`Failed to cordon node: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDrain = async (node: Node) => {
    try {
      await apiClient.drainNode(node.name);
      toast.success(`Node ${node.name} drained — workloads rescheduled`);
      await fetchNodes();
    } catch (err) {
      toast.error(`Failed to drain node: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const readyCount = nodes.filter((n) => n.status === "Ready").length;
  const totalCpu = nodes.reduce((acc, n) => acc + (Number.parseFloat(n.cpuCapacity) || 0), 0);
  const totalMemory = nodes.reduce((acc, n) => acc + (Number.parseFloat(n.memoryCapacity) || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-500">
            <Server className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cluster Nodes</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {readyCount}/{nodes.length} ready • {totalCpu} cores • {totalMemory} GiB memory pool
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-52 pl-8 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchNodes} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-muted-foreground flex flex-col items-center gap-1.5 py-12 text-xs">
              <ShieldAlert className="size-6 opacity-50" />
              No nodes match the search
            </CardContent>
          </Card>
        ) : (
          filtered.map((node) => (
            <Card key={node.name} className="hover:border-primary/40 transition-all duration-200">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg border ${
                      node.status === "Ready"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    <Server className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate font-mono text-sm">{node.name}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-1.5 text-xs">
                      {node.roles.map((role) => (
                        <Badge key={role} variant="outline" className="px-1.5 text-[10px]">
                          {role}
                        </Badge>
                      ))}
                    </CardDescription>
                  </div>
                </div>
                <CardAction className="flex items-center gap-2">
                  <ResourceStatusBadge status={node.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7" aria-label="Node actions">
                        <EllipsisVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {node.status === "SchedulingDisabled" ? (
                        <DropdownMenuItem onClick={() => handleCordon(node, false)}>
                          <PlayCircle /> Uncordon
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleCordon(node, true)}>
                          <PauseCircle /> Cordon
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onClick={() => handleDrain(node)}>
                        <ShieldAlert /> Drain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Version", node.version],
                    ["Runtime", node.containerRuntime],
                    ["Internal IP", node.internalIP],
                    ["OS", node.osImage],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-muted/20 flex flex-col gap-0.5 rounded-lg border p-2">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        {label}
                      </span>
                      <span className="truncate font-mono text-[11px]">{value || "-"}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1">
                        <Cpu className="size-3" /> CPU Allocatable
                      </span>
                      <span className="font-mono">
                        {node.allocatableCPU} / {node.cpuCapacity}
                      </span>
                    </div>
                    <Progress value={70} className="h-1.5" />
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1">
                        <MemoryStick className="size-3" /> Memory Allocatable
                      </span>
                      <span className="font-mono">
                        {node.allocatableMemory} / {node.memoryCapacity}
                      </span>
                    </div>
                    <Progress value={60} className="h-1.5" />
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1">
                        <HardDrive className="size-3" /> Pod Capacity
                      </span>
                      <span className="font-mono">{node.podsCapacity}</span>
                    </div>
                    <Progress value={40} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
