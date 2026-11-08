"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Boxes,
  Container,
  EllipsisVertical,
  FileCode2,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  SquareTerminal,
  Terminal,
  Trash2,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type Pod } from "@/lib/api-client";

export function PodsView() {
  const [pods, setPods] = useState<Pod[]>([]);
  const namespaces = useNamespaces();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; name: string; namespace: string }>({
    open: false,
    name: "",
    namespace: "",
  });
  const [detailsPod, setDetailsPod] = useState<Pod | null>(null);

  const fetchPods = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getPods(namespaceFilter === "all" ? undefined : namespaceFilter);
      setPods(data);
    } catch (err) {
      toast.error(`Failed to fetch pods: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchPods();
  }, [fetchPods]);

  const statuses = useMemo(() => Array.from(new Set(pods.map((p) => p.status))), [pods]);

  const filtered = useMemo(
    () =>
      pods.filter((pod) => {
        const matchesSearch =
          !search ||
          pod.name.toLowerCase().includes(search.toLowerCase()) ||
          pod.node.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || pod.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      }),
    [pods, search, statusFilter],
  );

  const handleDelete = async (pod: Pod) => {
    try {
      await apiClient.deleteResource("Pod", pod.name, pod.namespace);
      toast.success(`Pod ${pod.name} deleted`);
      await fetchPods();
    } catch (err) {
      toast.error(`Failed to delete pod: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleRestart = async (pod: Pod) => {
    try {
      await apiClient.restartPod(pod.name, pod.namespace);
      toast.success(`Pod ${pod.name} restart requested`);
      await fetchPods();
    } catch (err) {
      toast.error(`Failed to restart pod: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Container className="text-primary size-5" />
              Pods
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Running container instances across all namespaces, with live logs, exec shells and lifecycle actions.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search pods or nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchPods} disabled={isRefreshing}>
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="w-36">
                  <span className="text-muted-foreground">Status:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">All</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground text-sm tabular-nums">
              {filtered.length} of {pods.length} pods
            </span>
          </div>

          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Pod</TableHead>
                <TableHead className="py-3 font-normal">Namespace</TableHead>
                <TableHead className="py-3 font-normal">Status</TableHead>
                <TableHead className="py-3 font-normal">Ready</TableHead>
                <TableHead className="py-3 font-normal">Restarts</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Node</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">IP</TableHead>
                <TableHead className="w-10 py-3 font-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="text-muted-foreground h-12 text-xs">
                      Loading pods...
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-xs">
                      <Boxes className="size-5 opacity-50" />
                      No pods match the current filters
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((pod) => (
                  <TableRow key={`${pod.namespace}-${pod.name}`} className="hover:bg-muted/40">
                    <TableCell className="max-w-[240px]">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-muted rounded-lg border p-1.5">
                          <Container className="text-primary size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold">{pod.name}</p>
                          {pod.labels?.app && (
                            <p className="text-muted-foreground truncate text-[10px]">app: {pod.labels.app}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {pod.namespace}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ResourceStatusBadge status={pod.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{pod.ready}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      <span className={pod.restarts > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
                        {pod.restarts}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate font-mono text-xs md:table-cell">
                      {pod.node}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs lg:table-cell">{pod.ip}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label="Pod actions">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">
                            Pod Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setLogsDialog({
                                open: true,
                                podName: pod.name,
                                namespace: pod.namespace,
                                containers: pod.containers?.map((c) => ({ name: c.name, image: c.image })) || [],
                              })
                            }
                          >
                            <Terminal /> Live Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setExecDialog({
                                open: true,
                                podName: pod.name,
                                namespace: pod.namespace,
                                containers: pod.containers?.map((c) => ({ name: c.name, image: c.image })) || [],
                              })
                            }
                          >
                            <SquareTerminal /> Exec Shell
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDetailsPod(pod)}>
                            <Boxes /> Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setYamlDialog({ open: true, name: pod.name, namespace: pod.namespace })}
                          >
                            <FileCode2 /> View YAML
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRestart(pod)}>
                            <RotateCcw /> Restart
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(pod)}>
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
        </CardContent>
      </Card>

      {/* Dialogs */}
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
        resourceKind="Pod"
        resourceName={yamlDialog.name}
        namespace={yamlDialog.namespace}
      />

      {/* Details dialog */}
      <Dialog open={!!detailsPod} onOpenChange={(open) => !open && setDetailsPod(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Scale className="text-primary size-4" />
              <span className="font-mono">{detailsPod?.name}</span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="font-mono text-[10px]">
                {detailsPod?.namespace}
              </Badge>
              {detailsPod && <ResourceStatusBadge status={detailsPod.status} />}
            </DialogDescription>
          </DialogHeader>
          {detailsPod && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="bg-muted/20 grid grid-cols-2 gap-2 rounded-xl border p-3">
                {[
                  ["Node", detailsPod.node],
                  ["Pod IP", detailsPod.ip],
                  ["Phase", detailsPod.phase],
                  ["Created", detailsPod.createdAt],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      {label}
                    </span>
                    <span className="truncate font-mono">{value ?? "-"}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Containers
                </span>
                {detailsPod.containers?.map((container) => (
                  <div key={container.name} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold">{container.name}</p>
                      <p className="text-muted-foreground truncate text-[10px]">{container.image}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={container.ready ? "outline" : "destructive"} className="text-[10px]">
                        {container.ready ? "Ready" : "Not Ready"}
                      </Badge>
                      <span className="text-muted-foreground font-mono text-[10px]">↻ {container.restartCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
