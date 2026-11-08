"use client";

import { useCallback, useEffect, useState } from "react";

import { EllipsisVertical, Eye, EyeOff, FileCode2, FolderKey, KeyRound, RefreshCw, Search, Trash2 } from "lucide-react";
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
import { apiClient, type ConfigMap, type Secret } from "@/lib/api-client";

export function ConfigView() {
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const namespaces = useNamespaces();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [revealedSecrets, setRevealedSecrets] = useState<string[]>([]);

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
      const [cmData, secretData] = await Promise.all([apiClient.getConfigMaps(ns), apiClient.getSecrets(ns)]);
      setConfigMaps(cmData);
      setSecrets(secretData);
    } catch (err) {
      toast.error(`Failed to fetch config resources: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespaceFilter]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const matches = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());
  const filteredConfigMaps = configMaps.filter((c) => matches(c.name));
  const filteredSecrets = secrets.filter((s) => matches(s.name));

  const toggleReveal = (key: string) =>
    setRevealedSecrets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    try {
      await apiClient.deleteResource(kind, name, namespace);
      toast.success(`${kind} ${name} deleted`);
      await fetchData();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
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
              <FolderKey className="text-primary size-5" />
              Config & Secrets
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-snug">
              Non-sensitive configuration and sensitive credentials mounted by workloads.
            </CardDescription>
          </div>
          <CardAction className="flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search resources..."
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

          <Tabs defaultValue="configmaps" className="px-4">
            <TabsList>
              <TabsTrigger value="configmaps">ConfigMaps ({filteredConfigMaps.length})</TabsTrigger>
              <TabsTrigger value="secrets">Secrets ({filteredSecrets.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="configmaps" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Data Keys</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground h-12 text-xs">
                        Loading config maps...
                      </TableCell>
                    </TableRow>
                  ) : filteredConfigMaps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground h-20 text-center text-xs">
                        No config maps match the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConfigMaps.map((cm) => (
                      <TableRow key={`${cm.namespace}-${cm.name}`} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold">{cm.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {cm.namespace}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(cm.data)
                              .slice(0, 3)
                              .map((key) => (
                                <Badge key={key} variant="outline" className="font-mono text-[10px]">
                                  {key}
                                </Badge>
                              ))}
                            {Object.keys(cm.data).length > 3 && (
                              <span className="text-muted-foreground text-[10px]">
                                +{Object.keys(cm.data).length - 3}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                          {cm.age}
                        </TableCell>
                        <TableCell>{rowMenu("ConfigMap", cm.name, cm.namespace)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="secrets" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-normal">Name</TableHead>
                    <TableHead className="font-normal">Namespace</TableHead>
                    <TableHead className="font-normal">Type</TableHead>
                    <TableHead className="font-normal">Data Keys</TableHead>
                    <TableHead className="hidden font-normal md:table-cell">Age</TableHead>
                    <TableHead className="w-10 font-normal" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-12 text-xs">
                        Loading secrets...
                      </TableCell>
                    </TableRow>
                  ) : filteredSecrets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-20 text-center text-xs">
                        No secrets match the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSecrets.map((secret) => {
                      const revealKey = `${secret.namespace}/${secret.name}`;
                      const revealed = revealedSecrets.includes(revealKey);
                      return (
                        <TableRow key={revealKey} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-xs font-semibold">{secret.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {secret.namespace}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="gap-1 border border-amber-500/30 bg-amber-500/5 text-[10px]"
                              variant="outline"
                            >
                              <KeyRound className="size-2.5" />
                              {secret.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => toggleReveal(revealKey)}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-mono text-xs transition-colors"
                            >
                              {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                              {Object.keys(secret.data).length} keys
                            </button>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                            {secret.age}
                          </TableCell>
                          <TableCell>{rowMenu("Secret", secret.name, secret.namespace)}</TableCell>
                        </TableRow>
                      );
                    })
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
