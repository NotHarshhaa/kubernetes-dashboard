"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  BrainCircuit,
  Check,
  CircleDollarSign,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  HardDrive,
  Layers,
  Network,
  RefreshCw,
  Server,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import type { CloudProvider, CostRecommendation, FinOpsData } from "@/lib/finops";

export function FinOpsView() {
  const [data, setData] = useState<FinOpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [provider, setProvider] = useState<CloudProvider>("aws");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async (prov: CloudProvider) => {
    try {
      setRefreshing(true);
      const res = await apiClient.getFinOpsData(prov);
      setData(res);
    } catch (err) {
      toast.error(`Failed to load FinOps data: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(provider);
  }, [provider, fetchData]);

  const handleProviderChange = (newProvider: CloudProvider) => {
    setProvider(newProvider);
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    toast.success("kubectl command copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyRecommendation = async (rec: CostRecommendation) => {
    try {
      setApplyingId(rec.id);
      const res = await apiClient.applyFinOpsRecommendation(rec.id);
      setAppliedIds((prev) => new Set(prev).add(rec.id));
      toast.success(res.message);
    } catch (err) {
      toast.error(`Failed to apply optimization: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setApplyingId(null);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `k8s-finops-report-${provider}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("FinOps audit report exported successfully");
  };

  const filteredRecommendations = useMemo(() => {
    if (!data) return [];
    if (selectedType === "ALL") return data.recommendations;
    return data.recommendations.filter((r) => r.type === selectedType);
  }, [data, selectedType]);

  const activeSavings = useMemo(() => {
    if (!data) return 0;
    return data.recommendations.filter((r) => !appliedIds.has(r.id)).reduce((acc, r) => acc + r.monthlySavings, 0);
  }, [data, appliedIds]);

  const getEfficiencyColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
      case "B":
        return "text-blue-500 border-blue-500/30 bg-blue-500/10";
      case "C":
        return "text-amber-500 border-amber-500/30 bg-amber-500/10";
      default:
        return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm">
            <CircleDollarSign className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">FinOps & Cost Optimizer</h1>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
              >
                Live Attribution
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Cluster cost breakdown, waste detection, right-sizing recommendations, and efficiency scoring.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Pricing Profile:</span>
            <Select value={provider} onValueChange={(val) => handleProviderChange(val as CloudProvider)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aws">AWS (EKS / gp3)</SelectItem>
                <SelectItem value="gcp">Google Cloud (GKE)</SelectItem>
                <SelectItem value="azure">Azure (AKS)</SelectItem>
                <SelectItem value="custom">Bare-Metal / Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="h-8 gap-1.5 text-xs">
            <Download className="size-3.5" />
            Export Audit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(provider)}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Monthly Run Rate */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Monthly Run Rate
              </CardTitle>
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5 text-primary">
                <CircleDollarSign className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight">
                ${data.clusterMonthlySpend.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">/ mo</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                ~${Math.round(data.clusterMonthlySpend / 30)}/day across {data.summary.totalNodes} nodes (
                {data.summary.totalCores} vCPU)
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Potential Monthly Savings */}
          <Card className="relative overflow-hidden border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Potential Savings
              </CardTitle>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-500">
                <TrendingDown className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                -${Math.round(activeSavings).toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">/ mo</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {Math.round((activeSavings / data.clusterMonthlySpend) * 100)}% reducible through{" "}
                {data.recommendations.length} recommendations
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Wasted / Idle Spend */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Idle / Wasted Spend
              </CardTitle>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-500">
                <AlertTriangle className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                ${data.wastedSpend.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">/ mo</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Over-requested CPU/RAM & unattached block storage
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Cluster Efficiency Score */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Efficiency Score
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-xs font-bold px-2 ${getEfficiencyColor(data.efficiencyGrade)}`}
              >
                Grade {data.efficiencyGrade}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tracking-tight">{data.efficiencyScore}%</span>
                <span className="text-muted-foreground text-[11px]">Target: &gt;80%</span>
              </div>
              <Progress value={data.efficiencyScore} className="h-2" />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="recommendations" className="text-xs gap-1.5">
            <Sparkles className="size-3.5 text-indigo-500" />
            Optimization Recommendations
            {data && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {data.recommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="namespaces" className="text-xs gap-1.5">
            <Layers className="size-3.5" />
            Namespace Cost Attribution
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs gap-1.5">
            <CircleDollarSign className="size-3.5" />
            Resource Dimensions & Trend
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Optimization Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="size-4 text-amber-500" />
                    Automated Workload & Infrastructure Optimizations
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Actionable right-sizing, storage cleanups, and node consolidation tasks generated from actual
                    workload metrics.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    ["ALL", "All"],
                    ["RIGHTSIZE_DEPLOYMENT", "Right-Sizing"],
                    ["ORPHANED_PVC", "Storage"],
                    ["NODE_CONSOLIDATION", "Nodes"],
                    ["IDLE_GPU", "AI / GPU"],
                  ].map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedType === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(key)}
                      className="h-7 text-xs px-2.5"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {filteredRecommendations.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                  <Check className="size-6 text-emerald-500" />
                  <span>No optimization alerts for this category. Cluster resources are optimally provisioned!</span>
                </div>
              ) : (
                filteredRecommendations.map((rec) => {
                  const isApplied = appliedIds.has(rec.id);
                  const isApplying = applyingId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors ${
                        isApplied ? "bg-muted/20 opacity-60" : "bg-card hover:border-primary/40 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{rec.title}</span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {rec.resourceKind}: {rec.resourceName}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                              ns: {rec.namespace}
                            </Badge>
                            <Badge
                              className={`text-[10px] font-mono ${
                                rec.impactLevel === "HIGH"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {rec.impactLevel} IMPACT
                            </Badge>
                            {rec.risk === "SAFE" && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                SAFE
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs leading-relaxed">{rec.description}</p>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-base flex items-center gap-1">
                            <ArrowDownRight className="size-4" />
                            Save ${rec.monthlySavings.toFixed(1)}/mo
                          </div>
                          <span className="text-muted-foreground text-[10px]">
                            ${rec.currentMonthlyCost.toFixed(1)} &rarr; ${rec.projectedMonthlyCost.toFixed(1)}/mo
                          </span>
                        </div>
                      </div>

                      {/* Before / After Specs comparison */}
                      <div className="grid gap-2 sm:grid-cols-2 rounded-lg bg-muted/30 p-2.5 text-xs font-mono border">
                        <div>
                          <span className="text-muted-foreground text-[10px] font-sans font-semibold uppercase tracking-wider block">
                            Current Configuration:
                          </span>
                          <span className="text-rose-600 dark:text-rose-400">{rec.currentSpec}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] font-sans font-semibold uppercase tracking-wider block">
                            Recommended Target:
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {rec.recommendedSpec}
                          </span>
                        </div>
                      </div>

                      {/* Remediation command & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 rounded-lg border bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] text-zinc-100 flex-1 max-w-2xl overflow-x-auto shadow-inner">
                          <span className="text-zinc-400 select-none">$</span>
                          <span className="truncate select-all">{rec.remediationCommand}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyCommand(rec.remediationCommand, rec.id)}
                            className="size-5 ml-auto text-zinc-400 hover:text-white shrink-0"
                            title="Copy command"
                          >
                            {copiedId === rec.id ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href="/dashboard/terminal"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            Web Terminal <ExternalLink className="size-3" />
                          </Link>
                          <Button
                            size="sm"
                            disabled={isApplied || isApplying}
                            onClick={() => handleApplyRecommendation(rec)}
                            className="h-7.5 text-xs gap-1.5"
                          >
                            {isApplying ? (
                              <RefreshCw className="size-3 animate-spin" />
                            ) : isApplied ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Zap className="size-3" />
                            )}
                            {isApplied ? "Applied" : isApplying ? "Applying..." : "Apply Optimization"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Cost Attribution by Namespace */}
        <TabsContent value="namespaces" className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Namespace Cost Attribution & Efficiency
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Granular cost breakdown attributed to each Kubernetes namespace, including compute, memory, storage,
                  and GPU split.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">Namespace</TableHead>
                    <TableHead className="py-3">Monthly Spend</TableHead>
                    <TableHead className="py-3">% of Cluster</TableHead>
                    <TableHead className="py-3 hidden sm:table-cell">CPU Cost</TableHead>
                    <TableHead className="py-3 hidden md:table-cell">Memory Cost</TableHead>
                    <TableHead className="py-3 hidden lg:table-cell">Storage & GPU</TableHead>
                    <TableHead className="py-3 text-right">Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.namespaceBreakdown.map((ns) => (
                    <TableRow key={ns.namespace} className="hover:bg-muted/40 font-mono text-xs">
                      <TableCell className="font-sans font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {ns.namespace}
                          </Badge>
                          <span className="text-muted-foreground text-[10px] font-normal">({ns.podCount} pods)</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        ${ns.monthlyCost.toLocaleString()}
                        <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                      </TableCell>
                      <TableCell className="w-36">
                        <div className="flex items-center gap-2">
                          <Progress value={ns.percentage} className="h-1.5 flex-1" />
                          <span className="text-[11px] tabular-nums text-muted-foreground">{ns.percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        ${ns.cpuCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        ${ns.memoryCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        ${(ns.storageCost + ns.gpuCost).toLocaleString()}
                        {ns.gpuCost > 0 && (
                          <Badge variant="outline" className="ml-1 text-[9px] border-violet-500/30 text-violet-500">
                            GPU
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] ${
                            ns.efficiencyScore >= 80
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : ns.efficiencyScore >= 65
                                ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                                : "border-rose-500/30 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {ns.efficiencyScore}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Resource Dimensions & Trend */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* 14-day daily spend chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingDown className="size-4 text-emerald-500" />
                  14-Day Daily Spend vs. Optimized Trajectory
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical daily cloud bill trajectory and potential cost savings if recommendations are enacted.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="$" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "8px",
                          fontSize: "11px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="spend"
                        name="Current Spend"
                        stroke="var(--color-primary, #6366f1)"
                        strokeWidth={2}
                        fill="url(#spendGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="optimizedSpend"
                        name="Optimized Spend"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#optGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Resource Dimensions breakdown */}
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Cpu className="size-4 text-primary" />
                  Resource Cost Dimensions
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly expenditure grouped by infrastructure tier.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {data?.resourceBreakdown.map((res) => (
                  <div key={res.dimension} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2">
                        {res.dimension.includes("CPU") && <Cpu className="size-3.5 text-primary" />}
                        {res.dimension.includes("Memory") && <Server className="size-3.5 text-primary" />}
                        {res.dimension.includes("GPU") && <BrainCircuit className="size-3.5 text-violet-500" />}
                        {res.dimension.includes("Storage") && <HardDrive className="size-3.5 text-primary" />}
                        {res.dimension.includes("Network") && <Network className="size-3.5 text-primary" />}
                        {res.dimension}
                      </span>
                      <span className="font-mono">
                        ${res.monthlyCost.toLocaleString()} ({res.percentage}%)
                      </span>
                    </div>
                    <Progress value={res.percentage} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
