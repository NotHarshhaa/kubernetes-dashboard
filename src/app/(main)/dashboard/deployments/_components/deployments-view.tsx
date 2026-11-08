"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Database,
  EllipsisVertical,
  FileCode2,
  GitBranch,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Scaling,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type Deployment } from "@/lib/api-client";

export function DeploymentsView() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const namespaces = useNamespaces();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");

  const [scaleDialog, setScaleDialog] = useState<{ open: boolean; deployment: Deployment | null; replicas: number }>({
    open: false,
    deployment: null,
    replicas: 1,
  });
  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; name: string; namespace: string }>({
    open: false,
    name: "",
    namespace: "",
  });

  const fetchDeployments = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getDeployments(namespaceFilter === "all" ? undefined : namespaceFilter);
      setDeployments(data);
    } catch (err) {
      toast.error(`Failed to fetch deployments: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchDeployments();
  }, [fetchDeployments]);

  const filtered = useMemo(
    () => deployments.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [deployments, search],
  );

  const handleScale = async () => {
    if (!scaleDialog.deployment) return;
    try {
      await apiClient.scaleDeployment(
        scaleDialog.deployment.name,
        scaleDialog.deployment.namespace,
        scaleDialog.replicas,
      );
      toast.success(`Deployment ${scaleDialog.deployment.name} scaled to ${scaleDialog.replicas} replicas`);
      setScaleDialog({ open: false, deployment: null, replicas: 1 });
      await fetchDeployments();
    } catch (err) {
      toast.error(`Failed to scale: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleRestart = async (d: Deployment) => {
    try {
      await apiClient.restartDeployment(d.name, d.namespace);
      toast.success(`Rolling restart started for ${d.name}`);
      await fetchDeployments();
    } catch (err) {
      toast.error(`Failed to restart: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDelete = async (d: Deployment) => {
    try {
      await apiClient.deleteResource("Deployment", d.name, d.namespace);
      toast.success(`Deployment ${d.name} deleted`);
      await fetchDeployments();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const healthyCount = deployments.filter((d) => d.readyReplicas === d.replicas).length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Database className="text-primary size-5" />
              Deployments
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Rolling updates, replica health and GitOps sync status for declarative workloads.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search deployments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchDeployments} disabled={isRefreshing}>
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
            <span className="text-muted-foreground text-sm tabular-nums">
              {healthyCount}/{deployments.length} fully healthy
            </span>
          </div>

          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Deployment</TableHead>
                <TableHead className="py-3 font-normal">Namespace</TableHead>
                <TableHead className="py-3 font-normal">Replicas</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Image</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">GitOps</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">Age</TableHead>
                <TableHead className="w-10 py-3 font-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                      Loading deployments...
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-xs">
                      <Database className="size-5 opacity-50" />
                      No deployments match the current filters
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => {
                  const healthPct = d.replicas > 0 ? (d.readyReplicas / d.replicas) * 100 : 0;
                  return (
                    <TableRow key={`${d.namespace}-${d.name}`} className="hover:bg-muted/40">
                      <TableCell className="max-w-[240px]">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold">{d.name}</p>
                          <div className="mt-1 w-28">
                            <Progress value={healthPct} className="h-1" />
                          </div>
                        </div>
                      </TableCell>
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
                      <TableCell className="hidden lg:table-cell">
                        {d.gitops?.manager ? (
                          <Badge
                            variant="outline"
                            className={
                              d.gitops.syncStatus === "Synced"
                                ? "gap-1 border-emerald-500/30 bg-emerald-500/5 text-[10px]"
                                : "gap-1 border-amber-500/30 bg-amber-500/5 text-[10px]"
                            }
                          >
                            <GitBranch className="size-3" />
                            {d.gitops.manager} · {d.gitops.syncStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                        {d.age}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" aria-label="Deployment actions">
                              <EllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setScaleDialog({ open: true, deployment: d, replicas: d.replicas })}
                            >
                              <Scaling /> Scale
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRestart(d)}>
                              <RotateCcw /> Rolling Restart
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setYamlDialog({ open: true, name: d.name, namespace: d.namespace })}
                            >
                              <FileCode2 /> View YAML
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(d)}>
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scale dialog */}
      <Dialog open={scaleDialog.open} onOpenChange={(open) => setScaleDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Scaling className="text-primary size-4" />
              Scale <span className="text-primary font-mono">{scaleDialog.deployment?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adjust the desired replica count. Kubernetes performs a rolling update automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScaleDialog((prev) => ({ ...prev, replicas: Math.max(0, prev.replicas - 1) }))}
              aria-label="Decrease replicas"
            >
              <Minus className="size-4" />
            </Button>
            <span className="font-mono text-3xl font-bold tabular-nums">{scaleDialog.replicas}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScaleDialog((prev) => ({ ...prev, replicas: Math.min(50, prev.replicas + 1) }))}
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

      <YamlViewerDialog
        open={yamlDialog.open}
        onOpenChange={(open) => setYamlDialog((prev) => ({ ...prev, open }))}
        resourceKind="Deployment"
        resourceName={yamlDialog.name}
        namespace={yamlDialog.namespace}
      />
    </div>
  );
}
