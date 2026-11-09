"use client";

import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitCompare,
  GitPullRequest,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Workflow,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import type { GitOpsApp, GitOpsData, GitOpsEngine, GitOpsHealthStatus, GitOpsSyncStatus } from "@/lib/gitops";

export function GitOpsView() {
  const [data, setData] = useState<GitOpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [engineFilter, setEngineFilter] = useState<GitOpsEngine>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [diffApp, setDiffApp] = useState<GitOpsApp | null>(null);

  const fetchData = useCallback(async (eng: GitOpsEngine) => {
    try {
      setRefreshing(true);
      const res = await apiClient.getGitOpsData(eng);
      setData(res);
    } catch (err) {
      toast.error(`Failed to load GitOps data: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(engineFilter);
  }, [engineFilter, fetchData]);

  const handleSyncApp = async (app: GitOpsApp) => {
    try {
      setSyncingId(app.id);
      const res = await apiClient.syncGitOpsApp(app.id);
      toast.success(res.message);
      await fetchData(engineFilter);
    } catch (err) {
      toast.error(`Sync failed: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleSuspend = async (app: GitOpsApp) => {
    try {
      const res = await apiClient.toggleSuspendGitOpsApp(app.id);
      toast.success(res.message);
      await fetchData(engineFilter);
    } catch (err) {
      toast.error(`Action failed: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const filteredApps = useMemo(() => {
    if (!data) return [];
    return data.apps.filter((app) => {
      const matchesSearch =
        !search ||
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.repoUrl.toLowerCase().includes(search.toLowerCase()) ||
        app.path.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        app.syncStatus.toLowerCase() === statusFilter.toLowerCase() ||
        app.healthStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const allDrifts = useMemo(() => {
    if (!data) return [];
    return data.apps.flatMap((app) =>
      app.drifts.map((d) => ({
        ...d,
        appId: app.id,
        appName: app.name,
        engine: app.engine,
        repoUrl: app.repoUrl,
        targetRevision: app.targetRevision,
      })),
    );
  }, [data]);

  const getSyncStatusBadge = (status: GitOpsSyncStatus) => {
    switch (status) {
      case "Synced":
        return (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] gap-1">
            <CheckCircle2 className="size-3" /> Synced
          </Badge>
        );
      case "OutOfSync":
        return (
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] gap-1">
            <AlertTriangle className="size-3" /> Out of Sync
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const getHealthStatusBadge = (status: GitOpsHealthStatus) => {
    switch (status) {
      case "Healthy":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] gap-1"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" /> Healthy
          </Badge>
        );
      case "Progressing":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-[10px] gap-1"
          >
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" /> Progressing
          </Badge>
        );
      case "Degraded":
        return (
          <Badge variant="destructive" className="font-mono text-[10px] gap-1">
            <XCircle className="size-3" /> Degraded
          </Badge>
        );
      case "Suspended":
        return (
          <Badge variant="outline" className="border-zinc-500/30 text-zinc-400 font-mono text-[10px] gap-1">
            <PauseCircle className="size-3" /> Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-500 shadow-sm">
            <GitPullRequest className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">GitOps ArgoCD & Flux Hub</h1>
              <Badge
                variant="outline"
                className="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px]"
              >
                Multi-Engine
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Continuous deployment reconciliations, target repo tracking, live cluster drift, and automated rollouts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Engine filter toggles */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            {[
              ["all", "All Engines"],
              ["argocd", "ArgoCD"],
              ["flux", "Flux v2"],
            ].map(([eng, label]) => (
              <button
                type="button"
                key={eng}
                onClick={() => setEngineFilter(eng as GitOpsEngine)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  engineFilter === eng
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(engineFilter)}
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
          {/* Card 1: Total Apps */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Managed Workloads
              </CardTitle>
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5 text-primary">
                <Workflow className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight">
                {data.summary.totalApps}
                <span className="text-xs font-normal text-muted-foreground ml-1">apps</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {data.summary.argoAppsCount} ArgoCD • {data.summary.fluxKustomizationsCount} Flux Kustomizations
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Sync Status */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sync Status
              </CardTitle>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-500">
                <Check className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {data.summary.syncedCount} / {data.summary.totalApps}
                <span className="text-xs font-normal text-muted-foreground ml-1">synced</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {data.summary.outOfSyncCount > 0 ? (
                  <span className="text-amber-500 font-medium">
                    ⚠️ {data.summary.outOfSyncCount} out of sync with Git
                  </span>
                ) : (
                  "All applications fully synchronized"
                )}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Health Status */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Health Status
              </CardTitle>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-500">
                <Boxes className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight">
                {data.summary.healthyCount}
                <span className="text-xs font-normal text-muted-foreground ml-1">healthy</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {data.summary.degradedCount > 0 ? (
                  <span className="text-rose-500 font-medium">{data.summary.degradedCount} degraded / progressing</span>
                ) : (
                  "0 workloads degraded"
                )}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Drift Detection */}
          <Card
            className={`relative overflow-hidden ${data.summary.driftCount > 0 ? "border-amber-500/30 bg-amber-500/5" : ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Configuration Drift
              </CardTitle>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-500">
                <GitCompare className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                {data.summary.driftCount}
                <span className="text-xs font-normal text-muted-foreground ml-1">drifted fields</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Live cluster spec differs from declared Git target
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main Tabs */}
      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="apps" className="text-xs gap-1.5">
            <Workflow className="size-3.5" />
            Applications & Fleet Status
            {data && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {filteredApps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drift" className="text-xs gap-1.5">
            <GitCompare className="size-3.5 text-amber-500" />
            Cluster Drift Inspector
            {allDrifts.length > 0 && (
              <Badge
                variant="outline"
                className="ml-1 text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 px-1.5 py-0"
              >
                {allDrifts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1.5">
            <GitCommit className="size-3.5" />
            Sync & Commit History
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Applications */}
        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative max-w-sm min-w-[220px] flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search by app, repo, or path..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-xs font-medium">Status:</span>
                  <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                    {[
                      ["all", "All"],
                      ["synced", "Synced"],
                      ["outofsync", "Out of Sync"],
                      ["degraded", "Degraded"],
                    ].map(([st, label]) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                          statusFilter === st
                            ? "bg-background text-foreground shadow-xs font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">Application</TableHead>
                    <TableHead className="py-3">Engine</TableHead>
                    <TableHead className="py-3">Sync Status</TableHead>
                    <TableHead className="py-3">Health</TableHead>
                    <TableHead className="py-3 hidden md:table-cell">Git Target</TableHead>
                    <TableHead className="py-3 hidden lg:table-cell">Last Reconciled</TableHead>
                    <TableHead className="py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                        No GitOps applications match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApps.map((app) => (
                      <TableRow key={app.id} className="hover:bg-muted/40 text-xs">
                        {/* App name */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground font-mono">{app.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {app.kind}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground text-[10px]">
                              ns: <strong className="text-foreground">{app.namespace}</strong> •{" "}
                              {app.managedResourcesCount} resources
                            </span>
                          </div>
                        </TableCell>

                        {/* Engine */}
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-mono ${
                              app.engine === "argocd"
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                                : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                            }`}
                          >
                            {app.engine === "argocd" ? "ArgoCD" : "Flux v2"}
                          </Badge>
                        </TableCell>

                        {/* Sync status */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getSyncStatusBadge(app.syncStatus)}
                            {app.drifts.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setDiffApp(app)}
                                className="cursor-pointer text-amber-500 hover:underline font-mono text-[10px]"
                                title="Inspect drifts"
                              >
                                ({app.drifts.length} drifted)
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Health status */}
                        <TableCell>{getHealthStatusBadge(app.healthStatus)}</TableCell>

                        {/* Git Target */}
                        <TableCell className="hidden md:table-cell max-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate font-mono text-[11px] text-foreground flex items-center gap-1">
                              <GitBranch className="size-3 text-primary shrink-0" />
                              {app.targetRevision}
                            </span>
                            <span className="text-muted-foreground truncate text-[10px] font-mono" title={app.path}>
                              {app.path}
                            </span>
                          </div>
                        </TableCell>

                        {/* Last reconciled */}
                        <TableCell className="hidden lg:table-cell text-muted-foreground font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {app.lastSyncedAt}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {app.drifts.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDiffApp(app)}
                                className="h-7 px-2 text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                title="Inspect configuration drift"
                              >
                                <GitCompare className="size-3" />
                                <span className="hidden sm:inline ml-1">Diff</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={syncingId === app.id}
                              onClick={() => handleSyncApp(app)}
                              className="h-7 px-2 text-[11px] gap-1"
                              title="Trigger immediate sync / reconcile"
                            >
                              <RefreshCw className={`size-3 ${syncingId === app.id ? "animate-spin" : ""}`} />
                              <span className="hidden sm:inline">Sync</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleSuspend(app)}
                              className="h-7 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                              title={app.syncPolicy === "Suspended" ? "Resume reconcile" : "Suspend reconcile"}
                            >
                              {app.syncPolicy === "Suspended" ? (
                                <PlayCircle className="size-3.5 text-emerald-500" />
                              ) : (
                                <PauseCircle className="size-3.5 text-zinc-400" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Drift Inspector */}
        <TabsContent value="drift" className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GitCompare className="size-4 text-amber-500" />
                  Cluster Configuration Drift Inspector
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Resources that have deviated from their authoritative Git declarations through manual patching,
                  scaling, or runtime modifications.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {allDrifts.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                  <CheckCircle2 className="size-6 text-emerald-500" />
                  <span>Zero drift detected! Cluster state exactly matches all authoritative Git repositories.</span>
                </div>
              ) : (
                allDrifts.map((drift, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          {drift.kind} / {drift.name}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                          ns: {drift.namespace}
                        </Badge>
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono">
                          DRIFT: {drift.diffField}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px]">Source App:</span>
                        <span className="font-mono text-xs font-semibold">{drift.appName}</span>
                      </div>
                    </div>

                    {/* Diff box */}
                    <div className="grid gap-2 sm:grid-cols-2 rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-100 border">
                      <div className="space-y-1">
                        <span className="text-rose-400 text-[10px] font-sans font-bold uppercase tracking-wider block">
                          Declared in Git ({drift.targetRevision}):
                        </span>
                        <div className="rounded bg-rose-950/40 border border-rose-800/40 p-2 text-rose-300">
                          - {drift.gitDeclared}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-emerald-400 text-[10px] font-sans font-bold uppercase tracking-wider block">
                          Live Cluster Reality:
                        </span>
                        <div className="rounded bg-emerald-950/40 border border-emerald-800/40 p-2 text-emerald-300">
                          + {drift.liveCluster}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={drift.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-mono"
                      >
                        {drift.repoUrl} <ExternalLink className="size-3" />
                      </a>

                      <Button
                        size="sm"
                        onClick={() => {
                          const targetApp = data?.apps.find((a) => a.id === drift.appId);
                          if (targetApp) void handleSyncApp(targetApp);
                        }}
                        className="h-7 text-xs gap-1.5"
                      >
                        <RefreshCw className="size-3" />
                        Reconcile to Git
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Commit History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GitCommit className="size-4 text-primary" />
                  Reconciliation & Git Commit Audit Trail
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Timeline of Git commit hashes pulled and reconciled across cluster workloads.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">Commit SHA</TableHead>
                    <TableHead className="py-3">Application</TableHead>
                    <TableHead className="py-3">Commit Message</TableHead>
                    <TableHead className="py-3 hidden sm:table-cell">Author</TableHead>
                    <TableHead className="py-3 hidden md:table-cell">Time</TableHead>
                    <TableHead className="py-3 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.syncHistory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 text-xs font-mono">
                      <TableCell className="text-primary font-bold">{item.revision}</TableCell>
                      <TableCell className="font-sans font-medium text-foreground">{item.appName}</TableCell>
                      <TableCell className="font-sans max-w-sm truncate text-muted-foreground">
                        {item.commitMessage}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-[11px]">
                        {item.author}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-[11px]">
                        {item.timestamp}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={item.status === "SUCCESS" ? "outline" : "destructive"}
                          className={`font-mono text-[10px] ${
                            item.status === "SUCCESS"
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : ""
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diff Dialog */}
      <Dialog open={!!diffApp} onOpenChange={(open) => !open && setDiffApp(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-5">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <GitCompare className="size-4 text-amber-500" />
              <span>Configuration Drift Diff:</span>
              <span className="font-mono text-primary">{diffApp?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Namespace: <strong className="font-mono text-foreground">{diffApp?.namespace}</strong> • Target Revision:{" "}
              <strong className="font-mono text-foreground">{diffApp?.targetRevision}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
            {diffApp?.drifts.map((drift, idx) => (
              <div key={idx} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold font-mono text-foreground">
                    {drift.kind} / {drift.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] text-amber-500 border-amber-500/30">
                    Field: {drift.diffField}
                  </Badge>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 rounded-lg bg-zinc-950 p-2.5 font-mono text-xs border">
                  <div>
                    <span className="text-rose-400 text-[10px] uppercase block font-sans font-semibold">
                      Git Repo Declared:
                    </span>
                    <span className="text-rose-300">- {drift.gitDeclared}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] uppercase block font-sans font-semibold">
                      Live Cluster Actual:
                    </span>
                    <span className="text-emerald-300">+ {drift.liveCluster}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">
              Triggering sync will overwrite live cluster modifications to match Git.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDiffApp(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (diffApp) {
                    const target = diffApp;
                    setDiffApp(null);
                    void handleSyncApp(target);
                  }
                }}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Sync Application Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
