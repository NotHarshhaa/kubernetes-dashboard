"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EllipsisVertical, FileCode2, Globe, Network, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { apiClient, type Ingress, type Service } from "@/lib/api-client";

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [ingresses, setIngresses] = useState<Ingress[]>([]);
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
      const [servicesData, ingressData] = await Promise.all([apiClient.getServices(ns), apiClient.getIngresses(ns)]);
      setServices(servicesData);
      setIngresses(ingressData);
    } catch (err) {
      toast.error(`Failed to fetch services: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredServices = useMemo(
    () => services.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())),
    [services, search],
  );
  const filteredIngresses = useMemo(
    () => ingresses.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase())),
    [ingresses, search],
  );

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    try {
      await apiClient.deleteResource(kind, name, namespace);
      toast.success(`${kind} ${name} deleted`);
      await fetchData();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const serviceTypeBadge = (type: string) => {
    switch (type) {
      case "LoadBalancer":
        return (
          <Badge className="gap-1 border border-violet-500/30 bg-violet-500/5 text-[10px]" variant="outline">
            {type}
          </Badge>
        );
      case "NodePort":
        return (
          <Badge className="gap-1 border border-amber-500/30 bg-amber-500/5 text-[10px]" variant="outline">
            {type}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {type}
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
              <Network className="text-primary size-5" />
              Services & Ingress
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Cluster networking: stable service endpoints and HTTP(S) ingress routing rules.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search services..."
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

          <Tabs defaultValue="services" className="px-4">
            <TabsList>
              <TabsTrigger value="services">Services ({filteredServices.length})</TabsTrigger>
              <TabsTrigger value="ingresses">Ingresses ({filteredIngresses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Type</TableHead>
                    <TableHead className="font-normal">Cluster IP</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Ports</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">External IPs</TableHead>
                    <TableHead className="hidden font-normal lg:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground h-12 text-xs">
                        Loading services...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground h-20 text-center text-xs">
                        No services match the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((svc) => (
                      <TableRow key={`${svc.namespace}-${svc.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{svc.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {svc.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell>{serviceTypeBadge(svc.type)}</TableCell>
                        <TableCell className="font-mono text-xs">{svc.clusterIP}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {svc.ports}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {svc.externalIPs.length > 0 ? svc.externalIPs.join(", ") : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                          {svc.age}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Service actions">
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
                                    kind: "Service",
                                    name: svc.name,
                                    namespace: svc.namespace,
                                  })
                                }
                              >
                                <FileCode2 /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete("Service", svc.name, svc.namespace)}
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

            <TabsContent value="ingresses" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Hosts</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Paths / Backends</TableHead>
                    <TableHead className="font-normal">TLS</TableHead>
                    <TableHead className="hidden font-normal lg:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                        Loading ingresses...
                      </TableCell>
                    </TableRow>
                  ) : filteredIngresses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                        No ingresses match the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIngresses.map((ing) => (
                      <TableRow key={`${ing.namespace}-${ing.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{ing.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {ing.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {ing.hosts.map((host) => (
                              <Badge key={host} variant="outline" className="gap-1 font-mono text-[10px]">
                                <Globe className="size-2.5" />
                                {host}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden max-w-[260px] md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            {ing.paths.slice(0, 2).map((p, idx) => (
                              <span key={idx} className="text-muted-foreground truncate font-mono text-[10px]">
                                {p.path} → {p.backend}:{p.port}
                              </span>
                            ))}
                            {ing.paths.length > 2 && (
                              <span className="text-muted-foreground text-[10px]">+{ing.paths.length - 2} more</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ing.tls ? "default" : "outline"} className="text-[10px]">
                            {ing.tls ? "TLS" : "None"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                          {ing.age}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Ingress actions">
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
                                    kind: "Ingress",
                                    name: ing.name,
                                    namespace: ing.namespace,
                                  })
                                }
                              >
                                <FileCode2 /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete("Ingress", ing.name, ing.namespace)}
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
