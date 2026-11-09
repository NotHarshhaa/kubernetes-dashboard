"use client";

import { FileCode2, Package, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { YamlViewerDialog } from "@/app/(main)/dashboard/_components/yaml-viewer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type CustomResourceDefinitionItem } from "@/lib/api-client";

export function CrdsView() {
  const [crds, setCrds] = useState<CustomResourceDefinitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; name: string }>({ open: false, name: "" });

  const fetchCrds = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getCRDs();
      setCrds(data);
    } catch (err) {
      toast.error(`Failed to fetch CRDs: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void fetchCrds();
  }, [fetchCrds]);

  const filtered = crds.filter(
    (crd) =>
      !search ||
      crd.name.toLowerCase().includes(search.toLowerCase()) ||
      crd.group.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Package className="text-primary size-5" />
              Custom Resource Definitions
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              CRDs extending the Kubernetes API with operators and custom controllers.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search CRDs or groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchCrds} disabled={isRefreshing}>
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
                <TableHead className="py-3 font-normal">Group / Version</TableHead>
                <TableHead className="py-3 font-normal">Kind</TableHead>
                <TableHead className="py-3 font-normal">Scope</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Established</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">Categories</TableHead>
                <TableHead className="w-10 py-3 font-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-12 text-xs">
                    Loading CRDs...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-20 text-center text-xs">
                    <Package className="mx-auto mb-1.5 size-5 opacity-50" />
                    No custom resource definitions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((crd) => (
                  <TableRow key={crd.name} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs font-semibold">{crd.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {crd.group}/{crd.version}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {crd.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{crd.scope}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={
                          crd.established
                            ? "border-emerald-500/30 bg-emerald-500/5 text-[10px]"
                            : "border-amber-500/30 bg-amber-500/5 text-[10px]"
                        }
                      >
                        {crd.established ? "True" : "False"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {crd.categories.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px]">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="View CRD YAML"
                        onClick={() => setYamlDialog({ open: true, name: crd.name })}
                      >
                        <FileCode2 className="size-4" />
                      </Button>
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
        resourceKind="CustomResourceDefinition"
        resourceName={yamlDialog.name}
        namespace=""
      />
    </div>
  );
}
