"use client";

import { Anchor, ArrowDownToLine, EllipsisVertical, History, RefreshCw, Rocket, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useNamespaces } from "@/app/(main)/dashboard/_components/use-namespaces";
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
import { apiClient, type HelmChart, type HelmRelease } from "@/lib/api-client";

export function HelmView() {
  const [releases, setReleases] = useState<HelmRelease[]>([]);
  const [charts, setCharts] = useState<HelmChart[]>([]);
  const namespaces = useNamespaces();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");

  const [installDialog, setInstallDialog] = useState<{
    open: boolean;
    chart: HelmChart | null;
    releaseName: string;
    namespace: string;
  }>({
    open: false,
    chart: null,
    releaseName: "",
    namespace: "default",
  });

  const fetchHelm = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const ns = namespaceFilter === "all" ? undefined : namespaceFilter;
      const [releaseData, chartData] = await Promise.all([apiClient.getHelmReleases(ns), apiClient.getHelmCharts()]);
      setReleases(releaseData);
      setCharts(chartData);
    } catch (err) {
      toast.error(`Failed to fetch Helm data: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchHelm();
  }, [fetchHelm]);

  const matches = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());
  const filteredReleases = releases.filter((r) => matches(r.name));
  const filteredCharts = charts.filter(
    (c) => matches(c.name) || c.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleInstall = async () => {
    if (!installDialog.chart) return;
    try {
      await apiClient.installHelmChart(installDialog.chart.name, installDialog.releaseName, installDialog.namespace);
      toast.success(`Chart ${installDialog.chart.name} installed as ${installDialog.releaseName}`);
      setInstallDialog({ open: false, chart: null, releaseName: "", namespace: "default" });
      await fetchHelm();
    } catch (err) {
      toast.error(`Failed to install: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleRollback = async (release: HelmRelease) => {
    try {
      await apiClient.rollbackHelmRelease(release.name, release.namespace, release.revision - 1);
      toast.success(`Release ${release.name} rolled back`);
      await fetchHelm();
    } catch (err) {
      toast.error(`Failed to rollback: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleUninstall = async (release: HelmRelease) => {
    try {
      await apiClient.uninstallHelmRelease(release.name, release.namespace);
      toast.success(`Release ${release.name} uninstalled`);
      await fetchHelm();
    } catch (err) {
      toast.error(`Failed to uninstall: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const releaseStatusBadge = (status: string) => {
    switch (status) {
      case "deployed":
        return (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/5 text-[10px]">
            {status}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-[10px]">
            {status}
          </Badge>
        );
      case "pending-upgrade":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/5 text-[10px]">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Anchor className="text-primary size-5" />
              Helm Hub
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Chart releases deployed across the cluster and curated charts ready to install.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search releases or charts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchHelm} disabled={isRefreshing}>
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

          <Tabs defaultValue="releases" className="px-4">
            <TabsList>
              <TabsTrigger value="releases">Releases ({filteredReleases.length})</TabsTrigger>
              <TabsTrigger value="charts">Charts ({filteredCharts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="releases" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Release</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Chart</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Revision</TableHead>
                    <TableHead className="hidden font-normal lg:table-cell">Updated</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                        Loading releases...
                      </TableCell>
                    </TableRow>
                  ) : filteredReleases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                        <Anchor className="mx-auto mb-1.5 size-5 opacity-50" />
                        No Helm releases found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReleases.map((release) => (
                      <TableRow key={`${release.namespace}-${release.name}`} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs font-semibold">{release.name}</p>
                            <p className="text-muted-foreground max-w-[240px] truncate text-[10px]">
                              {release.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {release.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell>{releaseStatusBadge(release.status)}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {release.chart} · {release.appVersion}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs md:table-cell">#{release.revision}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                          {release.updated}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Release actions">
                                <EllipsisVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRollback(release)}>
                                <History /> Rollback
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleUninstall(release)}>
                                <Trash2 /> Uninstall
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

            <TabsContent value="charts" className="mt-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="text-muted-foreground col-span-full py-8 text-center text-xs">Loading charts...</div>
                ) : filteredCharts.length === 0 ? (
                  <div className="text-muted-foreground col-span-full flex flex-col items-center gap-1.5 py-8 text-xs">
                    <Rocket className="size-5 opacity-50" />
                    No charts match the search
                  </div>
                ) : (
                  filteredCharts.map((chart) => (
                    <div
                      key={`${chart.repository}-${chart.name}`}
                      className="hover:bg-muted/40 flex flex-col justify-between rounded-xl border p-4 transition-colors"
                    >
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="font-mono text-xs font-semibold">{chart.name}</p>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            v{chart.version}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">
                          {chart.description}
                        </p>
                        <p className="text-muted-foreground mt-2 font-mono text-[10px]">{chart.repository}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-muted-foreground font-mono text-[10px]">app {chart.appVersion}</span>
                        <Button
                          size="sm"
                          variant={chart.installed ? "outline" : "default"}
                          disabled={chart.installed}
                          onClick={() =>
                            setInstallDialog({ open: true, chart, releaseName: chart.name, namespace: "default" })
                          }
                        >
                          <ArrowDownToLine className="size-3.5" />
                          {chart.installed ? "Installed" : "Install"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Install dialog */}
      <Dialog open={installDialog.open} onOpenChange={(open) => setInstallDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Rocket className="text-primary size-4" />
              Install <span className="text-primary font-mono">{installDialog.chart?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deploy chart version {installDialog.chart?.version} as a new Helm release.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Release name</span>
              <Input
                value={installDialog.releaseName}
                onChange={(e) => setInstallDialog((prev) => ({ ...prev, releaseName: e.target.value }))}
                className="h-8 font-mono text-xs"
                placeholder="my-release"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Namespace</span>
              <Select
                value={installDialog.namespace}
                onValueChange={(v) => setInstallDialog((prev) => ({ ...prev, namespace: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(namespaces.length ? namespaces : ["default"]).map((ns) => (
                    <SelectItem key={ns} value={ns} className="font-mono text-xs">
                      {ns}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setInstallDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInstall} disabled={!installDialog.releaseName}>
              Install Chart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
