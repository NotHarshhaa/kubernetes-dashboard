"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EllipsisVertical, FileCode2, Layers, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ResourceStatusBadge } from "@/app/(main)/dashboard/_components/resource-status-badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type Namespace } from "@/lib/api-client";

export function NamespacesView() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; name: string }>({ open: false, name: "" });

  const fetchNamespaces = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getNamespaces();
      setNamespaces(data);
    } catch (err) {
      toast.error(`Failed to fetch namespaces: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void fetchNamespaces();
  }, [fetchNamespaces]);

  const filtered = useMemo(
    () => namespaces.filter((ns) => !search || ns.name.toLowerCase().includes(search.toLowerCase())),
    [namespaces, search],
  );

  const handleDelete = async (ns: Namespace) => {
    try {
      await apiClient.deleteResource("Namespace", ns.name, ns.name);
      toast.success(`Namespace ${ns.name} deleted`);
      await fetchNamespaces();
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
              <Layers className="text-primary size-5" />
              Namespaces
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              RBAC boundary partitions with resource quotas and usage limits.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search namespaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchNamespaces} disabled={isRefreshing}>
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Name</TableHead>
                <TableHead className="py-3 font-normal">Status</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Quota (pods / services)</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Limits (CPU / Memory)</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">Labels</TableHead>
                <TableHead className="py-3 font-normal">Age</TableHead>
                <TableHead className="w-10 py-3 font-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                    Loading namespaces...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                    <Layers className="mx-auto mb-1.5 size-5 opacity-50" />
                    No namespaces match the search
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ns) => (
                  <TableRow key={ns.name} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs font-semibold">{ns.name}</TableCell>
                    <TableCell>
                      <ResourceStatusBadge status={ns.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      {ns.resourceQuotas.pods || "-"} / {ns.resourceQuotas.services || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      {ns.limits.cpu || "-"} / {ns.limits.memory || "-"}
                    </TableCell>
                    <TableCell className="hidden max-w-[240px] lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(ns.labels)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <Badge key={key} variant="outline" className="font-mono text-[10px]">
                              {key}={value}
                            </Badge>
                          ))}
                        {Object.keys(ns.labels).length > 2 && (
                          <span className="text-muted-foreground text-[10px]">
                            +{Object.keys(ns.labels).length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{ns.age}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label="Namespace actions">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: ns.name })}>
                            <FileCode2 /> View YAML
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(ns)}>
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

      <YamlViewerDialog
        open={yamlDialog.open}
        onOpenChange={(open) => setYamlDialog((prev) => ({ ...prev, open }))}
        resourceKind="Namespace"
        resourceName={yamlDialog.name}
        namespace=""
      />
    </div>
  );
}
