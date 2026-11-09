"use client";

import { RefreshCw, Scale, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { useNamespaces } from "@/app/(main)/dashboard/_components/use-namespaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type HorizontalPodAutoscalerItem } from "@/lib/api-client";

export function AutoscalingView() {
  const [hpas, setHpas] = useState<HorizontalPodAutoscalerItem[]>([]);
  const namespaces = useNamespaces();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");

  const fetchHpas = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getHPAs(namespaceFilter === "all" ? undefined : namespaceFilter);
      setHpas(data);
    } catch (err) {
      toast.error(`Failed to fetch autoscalers: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchHpas();
  }, [fetchHpas]);

  const filtered = hpas.filter((h) => !search || h.name.toLowerCase().includes(search.toLowerCase()));

  const scalePosition = (hpa: HorizontalPodAutoscalerItem) => {
    const range = hpa.maxReplicas - hpa.minReplicas || 1;
    return Math.min(100, Math.max(0, ((hpa.currentReplicas - hpa.minReplicas) / range) * 100));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Scale className="text-primary size-5" />
              Autoscaling (HPA)
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Horizontal Pod Autoscalers reacting to CPU, memory and custom metrics.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search autoscalers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchHpas} disabled={isRefreshing}>
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <Select value={namespaceFilter} onValueChange={setNamespaceFilter}>
              <SelectTrigger size="sm" className="w-44">
                <span className="text-muted-foreground">Namespace:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All namespaces</SelectItem>
                {namespaces.map((ns) => (
                  <SelectItem key={ns} value={ns} className="font-mono text-xs">
                    {ns}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">HPA</TableHead>
                <TableHead className="py-3 font-normal">Namespace</TableHead>
                <TableHead className="py-3 font-normal">Target</TableHead>
                <TableHead className="py-3 font-normal">Replica Range</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Metrics</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">Last Scale</TableHead>
                <TableHead className="py-3 font-normal">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                    Loading autoscalers...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                    <Scale className="mx-auto mb-1.5 size-5 opacity-50" />
                    No HorizontalPodAutoscalers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((hpa) => {
                  const scalingUp = hpa.desiredReplicas > hpa.currentReplicas;
                  return (
                    <TableRow key={`${hpa.namespace}-${hpa.name}`} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-semibold">{hpa.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {hpa.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {hpa.targetKind}/{hpa.targetName}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="mb-1 flex items-center justify-between font-mono text-[11px] tabular-nums">
                          <span>{hpa.currentReplicas} pods</span>
                          <span className="text-muted-foreground">
                            {hpa.minReplicas}–{hpa.maxReplicas}
                          </span>
                        </div>
                        <Progress value={scalePosition(hpa)} className="h-1.5" />
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {hpa.metrics.slice(0, 2).map((metric, idx) => (
                            <span key={idx} className="text-muted-foreground font-mono text-[10px]">
                              {metric.type}:{" "}
                              {metric.currentUtilization !== undefined
                                ? `${metric.currentUtilization}% / ${metric.targetUtilization}%`
                                : metric.currentValue || metric.targetValue || "-"}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                        {hpa.lastScaleTime || "never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ResourceStatusBadge status={hpa.status} />
                          {hpa.desiredReplicas !== hpa.currentReplicas &&
                            (scalingUp ? (
                              <TrendingUp className="size-3.5 text-emerald-500" />
                            ) : (
                              <TrendingDown className="text-muted-foreground size-3.5" />
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
