"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Boxes,
  Container,
  EllipsisVertical,
  FileCode2,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Scaling,
  Search,
  SquareTerminal,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { PodExecDialog } from "@/app/(main)/dashboard/_components/pod-exec-dialog";
import { PodLogsDialog } from "@/app/(main)/dashboard/_components/pod-logs-dialog";
import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { useNamespaces } from "@/app/(main)/dashboard/_components/use-namespaces";
import { YamlViewerDialog } from "@/app/(main)/dashboard/_components/yaml-viewer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, type CronJob, type DaemonSet, type Deployment, type WorkloadSummary } from "@/lib/api-client";

export function WorkloadsView() {
  const [workloads, setWorkloads] = useState<WorkloadSummary | null>(null);
  const namespaces = useNamespaces();
  const [_loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("deployments");

  const [scaleDialog, setScaleDialog] = useState<{
    open: boolean;
    kind: "Deployment" | "StatefulSet";
    name: string;
    namespace: string;
    targetReplicas: number;
  }>({ open: false, kind: "Deployment", name: "", namespace: "", targetReplicas: 1 });

  const [logsDialog, setLogsDialog] = useState<{
    open: boolean;
    podName: string;
    namespace: string;
    containers: { name: string; image?: string }[];
  }>({
    open: false,
    podName: "",
    namespace: "",
    containers: [],
  });
  const [execDialog, setExecDialog] = useState<{
    open: boolean;
    podName: string;
    namespace: string;
    containers: { name: string; image?: string }[];
  }>({
    open: false,
    podName: "",
    namespace: "",
    containers: [],
  });
  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; kind: string; name: string; namespace: string }>({
    open: false,
    kind: "",
    name: "",
    namespace: "",
  });

  const fetchWorkloads = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await apiClient.getWorkloads(namespaceFilter === "all" ? undefined : namespaceFilter);
      setWorkloads(res);
    } catch (err) {
      toast.error(`Failed to fetch workloads: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchWorkloads();
  }, [fetchWorkloads]);

  const matchesSearch = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());

  const handleScale = async () => {
    try {
      if (scaleDialog.kind === "Deployment") {
        await apiClient.scaleDeployment(scaleDialog.name, scaleDialog.namespace, scaleDialog.targetReplicas);
      } else {
        await apiClient.scaleStatefulSet(scaleDialog.name, scaleDialog.namespace, scaleDialog.targetReplicas);
      }
      toast.success(`${scaleDialog.kind} ${scaleDialog.name} scaled to ${scaleDialog.targetReplicas} replicas`);
      setScaleDialog((prev) => ({ ...prev, open: false }));
      await fetchWorkloads();
    } catch (err) {
      toast.error(`Failed to scale: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    try {
      await apiClient.deleteResource(kind, name, namespace);
      toast.success(`${kind} ${name} deleted`);
      await fetchWorkloads();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleRestartDeployment = async (d: Deployment) => {
    try {
      await apiClient.restartDeployment(d.name, d.namespace);
      toast.success(`Rolling restart started for ${d.name}`);
      await fetchWorkloads();
    } catch (err) {
      toast.error(`Failed to restart: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleRestartDaemonSet = async (ds: DaemonSet) => {
    try {
      await apiClient.restartDaemonSet(ds.name, ds.namespace);
      toast.success(`Rolling restart started for ${ds.name}`);
      await fetchWorkloads();
    } catch (err) {
      toast.error(`Failed to restart: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleTriggerCronJob = async (cj: CronJob) => {
    try {
      await apiClient.triggerCronJob(cj.name, cj.namespace);
      toast.success(`CronJob ${cj.name} triggered`);
      await fetchWorkloads();
    } catch (err) {
      toast.error(`Failed to trigger: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleToggleSuspend = async (cj: CronJob) => {
    try {
      await apiClient.toggleCronJobSuspend(cj.name, cj.namespace);
      toast.success(`CronJob ${cj.name} suspend state toggled`);
      await fetchWorkloads();
    } catch (err) {
      toast.error(`Failed to toggle suspend: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Workloads",
        value: workloads?.summary.totalWorkloads ?? 0,
        icon: Boxes,
        iconClass: "border-primary/20 bg-primary/10 text-primary",
      },
      {
        label: "Healthy",
        value: workloads?.summary.healthyWorkloads ?? 0,
        icon: Zap,
        iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
      },
      {
        label: "Total Pods",
        value: workloads?.summary.totalPods ?? 0,
        icon: Container,
        iconClass: "border-sky-500/20 bg-sky-500/10 text-sky-500",
      },
      {
        label: "Running Pods",
        value: workloads?.summary.runningPods ?? 0,
        icon: Container,
        iconClass: "border-violet-500/20 bg-violet-500/10 text-violet-500",
      },
    ],
    [workloads],
  );

  const deployments = (workloads?.deployments ?? []).filter((d) => matchesSearch(d.name));
  const statefulSets = (workloads?.statefulSets ?? []).filter((d) => matchesSearch(d.name));
  const daemonSets = (workloads?.daemonSets ?? []).filter((d) => matchesSearch(d.name));
  const jobs = (workloads?.jobs ?? []).filter((d) => matchesSearch(d.name));
  const cronJobs = (workloads?.cronJobs ?? []).filter((d) => matchesSearch(d.name));
  const pods = (workloads?.pods ?? []).filter((d) => matchesSearch(d.name));

  const openScale = (kind: "Deployment" | "StatefulSet", name: string, namespace: string, replicas: number) =>
    setScaleDialog({ open: true, kind, name, namespace, targetReplicas: replicas });

  const openYaml = (kind: string, name: string, namespace: string) =>
    setYamlDialog({ open: true, kind, name, namespace });

  const rowMenu = (kind: string, name: string, namespace: string, children: React.ReactNode) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label={`${kind} actions`}>
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
        <DropdownMenuItem onClick={() => openYaml(kind, name, namespace)}>
          <FileCode2 /> View YAML
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => handleDelete(kind, name, namespace)}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {summaryCards.map((card) => {
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
                <div className="font-mono text-2xl font-bold tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Boxes className="text-primary size-5" />
              Workload Controllers
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Deployments, StatefulSets, DaemonSets, Jobs and CronJobs with lifecycle actions.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search workloads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchWorkloads} disabled={isRefreshing}>
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
            <TabsList className="h-auto w-full flex-wrap p-1">
              <TabsTrigger value="deployments">Deployments ({deployments.length})</TabsTrigger>
              <TabsTrigger value="statefulsets">StatefulSets ({statefulSets.length})</TabsTrigger>
              <TabsTrigger value="daemonsets">DaemonSets ({daemonSets.length})</TabsTrigger>
              <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
              <TabsTrigger value="cronjobs">CronJobs ({cronJobs.length})</TabsTrigger>
              <TabsTrigger value="pods">Pods ({pods.length})</TabsTrigger>
            </TabsList>

            {/* Deployments */}
            <TabsContent value="deployments" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Replicas</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Image</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No deployments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    deployments.map((d) => (
                      <TableRow key={`${d.namespace}-${d.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{d.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {d.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {d.readyReplicas}/{d.replicas}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden max-w-[220px] truncate font-mono text-xs md:table-cell">
                          {d.images[0] || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {d.age}
                        </TableCell>
                        <TableCell>
                          {rowMenu(
                            "Deployment",
                            d.name,
                            d.namespace,
                            <>
                              <DropdownMenuItem
                                onClick={() => openScale("Deployment", d.name, d.namespace, d.replicas)}
                              >
                                <Scaling /> Scale
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRestartDeployment(d)}>
                                <RotateCcw /> Rolling Restart
                              </DropdownMenuItem>
                            </>,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* StatefulSets */}
            <TabsContent value="statefulsets" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Replicas</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Service</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statefulSets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No statefulsets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    statefulSets.map((s) => (
                      <TableRow key={`${s.namespace}-${s.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {s.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {s.readyReplicas}/{s.replicas}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {s.serviceName}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {s.age}
                        </TableCell>
                        <TableCell>
                          {rowMenu(
                            "StatefulSet",
                            s.name,
                            s.namespace,
                            <DropdownMenuItem onClick={() => openScale("StatefulSet", s.name, s.namespace, s.replicas)}>
                              <Scaling /> Scale
                            </DropdownMenuItem>,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* DaemonSets */}
            <TabsContent value="daemonsets" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Scheduled</TableHead>
                    <TableHead className="font-normal">Ready</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daemonSets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No daemonsets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    daemonSets.map((ds) => (
                      <TableRow key={`${ds.namespace}-${ds.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{ds.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {ds.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">{ds.desiredNumberScheduled}</TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">{ds.numberReady}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {ds.age}
                        </TableCell>
                        <TableCell>
                          {rowMenu(
                            "DaemonSet",
                            ds.name,
                            ds.namespace,
                            <DropdownMenuItem onClick={() => handleRestartDaemonSet(ds)}>
                              <RotateCcw /> Rolling Restart
                            </DropdownMenuItem>,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Jobs */}
            <TabsContent value="jobs" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="font-normal">Completions</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Duration</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((j) => (
                      <TableRow key={`${j.namespace}-${j.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{j.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {j.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ResourceStatusBadge status={j.status} />
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {j.succeeded}/{j.completions}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {j.duration || "-"}
                        </TableCell>
                        <TableCell>{rowMenu("Job", j.name, j.namespace, null)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* CronJobs */}
            <TabsContent value="cronjobs" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Schedule</TableHead>
                    <TableHead className="font-normal">Suspend</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Last Schedule</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cronJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No cronjobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    cronJobs.map((cj) => (
                      <TableRow key={`${cj.namespace}-${cj.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{cj.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {cj.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{cj.schedule}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              cj.suspend
                                ? "gap-1 border-amber-500/30 bg-amber-500/5 text-[10px]"
                                : "gap-1 border-emerald-500/30 bg-emerald-500/5 text-[10px]"
                            }
                          >
                            {cj.suspend ? <Pause className="size-3" /> : <Play className="size-3" />}
                            {cj.suspend ? "Suspended" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {cj.lastScheduleTime || "never"}
                        </TableCell>
                        <TableCell>
                          {rowMenu(
                            "CronJob",
                            cj.name,
                            cj.namespace,
                            <>
                              <DropdownMenuItem onClick={() => handleTriggerCronJob(cj)}>
                                <Play /> Trigger Now
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleSuspend(cj)}>
                                {cj.suspend ? <Play /> : <Pause />}
                                {cj.suspend ? "Resume" : "Suspend"}
                              </DropdownMenuItem>
                            </>,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Pods */}
            <TabsContent value="pods" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="font-normal">Ready</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Node</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No pods found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pods.map((p) => (
                      <TableRow key={`${p.namespace}-${p.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {p.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ResourceStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">{p.ready}</TableCell>
                        <TableCell className="text-muted-foreground hidden max-w-[160px] truncate font-mono text-xs md:table-cell">
                          {p.node}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Pod actions">
                                <EllipsisVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setLogsDialog({
                                    open: true,
                                    podName: p.name,
                                    namespace: p.namespace,
                                    containers: p.containers?.map((c) => ({ name: c.name, image: c.image })) || [],
                                  })
                                }
                              >
                                <Terminal /> Live Logs
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setExecDialog({
                                    open: true,
                                    podName: p.name,
                                    namespace: p.namespace,
                                    containers: p.containers?.map((c) => ({ name: c.name, image: c.image })) || [],
                                  })
                                }
                              >
                                <SquareTerminal /> Exec Shell
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openYaml("Pod", p.name, p.namespace)}>
                                <FileCode2 /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete("Pod", p.name, p.namespace)}
                              >
                                <Trash2 /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Shared dialogs */}
      <PodLogsDialog
        open={logsDialog.open}
        onOpenChange={(open) => setLogsDialog((prev) => ({ ...prev, open }))}
        podName={logsDialog.podName}
        namespace={logsDialog.namespace}
        containers={logsDialog.containers}
      />
      <PodExecDialog
        open={execDialog.open}
        onOpenChange={(open) => setExecDialog((prev) => ({ ...prev, open }))}
        podName={execDialog.podName}
        namespace={execDialog.namespace}
        containers={execDialog.containers}
      />
      <YamlViewerDialog
        open={yamlDialog.open}
        onOpenChange={(open) => setYamlDialog((prev) => ({ ...prev, open }))}
        resourceKind={yamlDialog.kind}
        resourceName={yamlDialog.name}
        namespace={yamlDialog.namespace}
      />

      {/* Scale dialog */}
      <Dialog open={scaleDialog.open} onOpenChange={(open) => setScaleDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Scaling className="text-primary size-4" />
              Scale <span className="text-primary font-mono">{scaleDialog.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adjust the desired replica count for this {scaleDialog.kind}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-6 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setScaleDialog((prev) => ({ ...prev, targetReplicas: Math.max(0, prev.targetReplicas - 1) }))
              }
              aria-label="Decrease replicas"
            >
              <Minus className="size-4" />
            </Button>
            <span className="font-mono text-3xl font-bold tabular-nums">{scaleDialog.targetReplicas}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setScaleDialog((prev) => ({ ...prev, targetReplicas: Math.min(50, prev.targetReplicas + 1) }))
              }
              aria-label="Increase replicas"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setScaleDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleScale}>
              Apply Scale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
