"use client";

import { useCallback, useEffect, useState } from "react";

import { ArrowRightLeft, EllipsisVertical, FileCode2, GitFork, Globe, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
import { useNamespaces } from "@/app/(main)/dashboard/_components/use-namespaces";
import { YamlViewerDialog } from "@/app/(main)/dashboard/_components/yaml-viewer-dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, type GatewayItem, type HTTPRouteItem } from "@/lib/api-client";

export function GatewaysView() {
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [routes, setRoutes] = useState<HTTPRouteItem[]>([]);
  const namespaces = useNamespaces();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");

  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; kind: string; name: string; namespace: string }>({
    open: false,
    kind: "",
    name: "",
    namespace: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const ns = namespaceFilter === "all" ? undefined : namespaceFilter;
      const [gatewayData, routeData] = await Promise.all([apiClient.getGateways(ns), apiClient.getHTTPRoutes(ns)]);
      setGateways(gatewayData);
      setRoutes(routeData);
    } catch (err) {
      toast.error(`Failed to fetch gateway resources: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const matches = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());
  const filteredGateways = gateways.filter((g) => matches(g.name));
  const filteredRoutes = routes.filter((r) => matches(r.name));

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    try {
      await apiClient.deleteResource(kind, name, namespace);
      toast.success(`${kind} ${name} deleted`);
      await fetchData();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <GitFork className="text-primary size-5" />
              Gateway API
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Next-gen Kubernetes gateway resources: listeners, addresses and HTTPRoute traffic rules.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search gateways..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isRefreshing}>
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

          <Tabs defaultValue="gateways" className="px-4">
            <TabsList>
              <TabsTrigger value="gateways">Gateways ({filteredGateways.length})</TabsTrigger>
              <TabsTrigger value="routes">HTTPRoutes ({filteredRoutes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="gateways" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Class</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Listeners</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Addresses</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                        Loading gateways...
                      </TableCell>
                    </TableRow>
                  ) : filteredGateways.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                        <GitFork className="mx-auto mb-1.5 size-5 opacity-50" />
                        No gateways found — install a Gateway API implementation
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGateways.map((gw) => (
                      <TableRow key={`${gw.namespace}-${gw.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{gw.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {gw.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{gw.gatewayClassName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {gw.listeners.slice(0, 2).map((l) => (
                              <Badge key={l.name} variant="outline" className="font-mono text-[10px]">
                                {l.name}:{l.port}/{l.protocol}
                              </Badge>
                            ))}
                            {gw.listeners.length > 2 && (
                              <span className="text-muted-foreground text-[10px]">+{gw.listeners.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden max-w-[180px] truncate font-mono text-xs md:table-cell">
                          {gw.addresses.join(", ") || "-"}
                        </TableCell>
                        <TableCell>
                          <ResourceStatusBadge status={gw.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Gateway actions">
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
                                  setYamlDialog({ open: true, kind: "Gateway", name: gw.name, namespace: gw.namespace })
                                }
                              >
                                <FileCode2 /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete("Gateway", gw.name, gw.namespace)}
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

            <TabsContent value="routes" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Hostnames</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Parent Gateways</TableHead>
                    <TableHead className="hidden font-normal lg:table-cell">Backends</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                        Loading routes...
                      </TableCell>
                    </TableRow>
                  ) : filteredRoutes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                        <ArrowRightLeft className="mx-auto mb-1.5 size-5 opacity-50" />
                        No HTTPRoutes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoutes.map((route) => (
                      <TableRow key={`${route.namespace}-${route.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{route.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {route.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {route.hostnames.map((host) => (
                              <Badge key={host} variant="outline" className="gap-1 font-mono text-[10px]">
                                <Globe className="size-2.5" />
                                {host}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {route.parentGateways.join(", ") || "-"}
                        </TableCell>
                        <TableCell className="hidden max-w-[220px] lg:table-cell">
                          <div className="flex flex-col gap-0.5">
                            {route.rules.slice(0, 2).map((rule, idx) => (
                              <span key={idx} className="text-muted-foreground truncate font-mono text-[10px]">
                                {rule.backendRefs.map((b) => `${b.name}:${b.port}`).join(", ")}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ResourceStatusBadge status={route.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Route actions">
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
                                  setYamlDialog({
                                    open: true,
                                    kind: "HTTPRoute",
                                    name: route.name,
                                    namespace: route.namespace,
                                  })
                                }
                              >
                                <FileCode2 /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete("HTTPRoute", route.name, route.namespace)}
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

      <YamlViewerDialog
        open={yamlDialog.open}
        onOpenChange={(open) => setYamlDialog((prev) => ({ ...prev, open }))}
        resourceKind={yamlDialog.kind}
        resourceName={yamlDialog.name}
        namespace={yamlDialog.namespace}
      />
    </div>
  );
}
