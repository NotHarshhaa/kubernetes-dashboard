"use client";

import { useCallback, useEffect, useState } from "react";

import { Database, EllipsisVertical, FileCode2, HardDrive, Layers, RefreshCw, Search, Trash2 } from "lucide-react";
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
import { apiClient, type StorageData } from "@/lib/api-client";

export function StorageView() {
  const [storage, setStorage] = useState<StorageData | null>(null);
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

  const fetchStorage = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getStorageData(namespaceFilter === "all" ? undefined : namespaceFilter);
      setStorage(data);
    } catch (err) {
      toast.error(`Failed to fetch storage: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchStorage();
  }, [fetchStorage]);

  const matches = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());

  const pvs = (storage?.persistentVolumes ?? []).filter((p) => matches(p.name));
  const pvcs = (storage?.persistentVolumeClaims ?? []).filter((p) => matches(p.name));
  const storageClasses = (storage?.storageClasses ?? []).filter((s) => matches(s.name));

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    try {
      await apiClient.deleteResource(kind, name, namespace);
      toast.success(`${kind} ${name} deleted`);
      await fetchStorage();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const statusBadge = (status: string) => {
    const cls =
      status === "Bound" || status === "Available"
        ? "border-emerald-500/30 bg-emerald-500/5"
        : status === "Pending" || status === "Released"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-rose-500/30 bg-rose-500/5";
    return (
      <Badge variant="outline" className={`gap-1 text-[10px] ${cls}`}>
        {status}
      </Badge>
    );
  };

  const rowMenu = (kind: string, name: string, namespace: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label={`${kind} actions`}>
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind, name, namespace })}>
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
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <HardDrive className="text-primary size-5" />
              Storage & Persistent Volumes
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              PersistentVolumes, claims and storage classes backing cluster stateful workloads.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search storage..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchStorage} disabled={isRefreshing}>
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

          <Tabs defaultValue="pvcs" className="px-4">
            <TabsList>
              <TabsTrigger value="pvcs">PVCs ({pvcs.length})</TabsTrigger>
              <TabsTrigger value="pvs">PVs ({pvs.length})</TabsTrigger>
              <TabsTrigger value="classes">Storage Classes ({storageClasses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pvcs" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="font-normal">Volume</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Capacity</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Storage Class</TableHead>
                    <TableHead className="hidden font-normal lg:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground h-12 text-xs">
                        Loading claims...
                      </TableCell>
                    </TableRow>
                  ) : pvcs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground h-20 text-center text-xs">
                        No persistent volume claims found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pvcs.map((pvc) => (
                      <TableRow key={`${pvc.namespace}-${pvc.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{pvc.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {pvc.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell>{statusBadge(pvc.status)}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{pvc.volume}</TableCell>
                        <TableCell className="hidden font-mono text-xs md:table-cell">{pvc.capacity}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {pvc.storageClass}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                          {pvc.age}
                        </TableCell>
                        <TableCell>{rowMenu("PersistentVolumeClaim", pvc.name, pvc.namespace)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pvs" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Status</TableHead>
                    <TableHead className="font-normal">Capacity</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Claim</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Reclaim Policy</TableHead>
                    <TableHead className="hidden font-normal lg:table-cell">Volume Type</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                        Loading volumes...
                      </TableCell>
                    </TableRow>
                  ) : pvs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                        No persistent volumes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pvs.map((pv) => (
                      <TableRow key={pv.name} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{pv.name}</TableCell>
                        <TableCell>{statusBadge(pv.status)}</TableCell>
                        <TableCell className="font-mono text-xs">{pv.capacity}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {pv.claim}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {pv.reclaimPolicy}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                          {pv.volumeType}
                        </TableCell>
                        <TableCell>{rowMenu("PersistentVolume", pv.name, "")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="classes" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Provisioner</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Reclaim Policy</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Binding Mode</TableHead>
                    <TableHead className="font-normal">Default</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-12 text-xs">
                        Loading storage classes...
                      </TableCell>
                    </TableRow>
                  ) : storageClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        <Layers className="mx-auto mb-1.5 size-5 opacity-50" />
                        No storage classes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    storageClasses.map((sc) => (
                      <TableRow key={sc.name} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{sc.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{sc.provisioner}</TableCell>
                        <TableCell className="hidden font-mono text-xs md:table-cell">{sc.reclaimPolicy}</TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {sc.volumeBindingMode}
                        </TableCell>
                        <TableCell>
                          {sc.isDefault ? (
                            <Badge
                              className="border-primary/30 bg-primary/5 gap-1 border text-[10px]"
                              variant="outline"
                            >
                              <Database className="size-2.5" /> Default
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>{rowMenu("StorageClass", sc.name, "")}</TableCell>
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
