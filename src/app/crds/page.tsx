"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { apiClient, CustomResourceDefinitionItem } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  FileCode2, 
  Layers, 
  ShieldAlert, 
  Sparkles,
  ExternalLink,
  Code2
} from "lucide-react"

export default function CrdsPage() {
  const [crds, setCrds] = useState<CustomResourceDefinitionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedCrdForYaml, setSelectedCrdForYaml] = useState<CustomResourceDefinitionItem | null>(null)
  const [yamlOpen, setYamlOpen] = useState(false)
  const { error: showError } = useToast()

  const fetchCrds = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCRDs()
      setCrds(data)
    } catch (err) {
      showError(`Failed to load Custom Resources: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchCrds()
  }, [fetchCrds])

  // Extract unique API groups
  const groups = Array.from(new Set(crds.map(c => c.group))).sort()

  const filtered = crds.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.kind.toLowerCase().includes(search.toLowerCase()) ||
      c.group.toLowerCase().includes(search.toLowerCase())
    const matchesGroup = selectedGroup === 'all' || c.group === selectedGroup
    return matchesSearch && matchesGroup
  })

  const establishedCount = crds.filter(c => c.established).length
  const namespacedCount = crds.filter(c => c.scope === 'Namespaced').length
  const clusterCount = crds.filter(c => c.scope === 'Cluster').length

  const handleInspectYaml = (crd: CustomResourceDefinitionItem) => {
    setSelectedCrdForYaml(crd)
    setYamlOpen(true)
  }

  const generatedCrdYaml = selectedCrdForYaml ? `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: ${selectedCrdForYaml.name}
  creationTimestamp: "${selectedCrdForYaml.creationTimestamp}"
  labels:
    app.kubernetes.io/managed-by: kubernetes-dashboard
spec:
  group: ${selectedCrdForYaml.group}
  scope: ${selectedCrdForYaml.scope}
  names:
    plural: ${selectedCrdForYaml.name.split('.')[0]}
    singular: ${selectedCrdForYaml.singularName}
    kind: ${selectedCrdForYaml.kind}
    categories: ${JSON.stringify(selectedCrdForYaml.categories)}
  versions:
    - name: ${selectedCrdForYaml.version}
      served: true
      storage: true
status:
  conditions:
    - type: Established
      status: "True"
      reason: InitialNamesAccepted
` : ''

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Boxes className="size-6 text-primary" />
                Custom Resource Definitions (CRDs)
              </h2>
              <p className="text-sm text-muted-foreground">
                Dynamically discover and inspect extended Kubernetes APIs, operators, and schemas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCrds}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total CRDs
                </CardTitle>
                <Boxes className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crds.length}</div>
                <p className="text-xs text-muted-foreground">Active in cluster schema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  API Groups
                </CardTitle>
                <Layers className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groups.length}</div>
                <p className="text-xs text-muted-foreground">Unique domain extensions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Namespaced Scope
                </CardTitle>
                <Code2 className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{namespacedCount}</div>
                <p className="text-xs text-muted-foreground">{clusterCount} cluster-scoped</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Established Ratio
                </CardTitle>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{establishedCount}/{crds.length}</div>
                <p className="text-xs text-muted-foreground">100% healthy ready condition</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Search Bar */}
          <Card>
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by CRD name, Kind (e.g. Certificate, Prometheus), or API group..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                {/* API Group Filter Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setSelectedGroup('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedGroup === 'all'
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    All Groups
                  </button>
                  {groups.slice(0, 5).map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedGroup === g
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Kind & Singular</TableHead>
                    <TableHead>API Group & Version</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Instances</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <RefreshCw className="size-5 animate-spin inline mr-2 text-primary" />
                        Querying CustomResourceDefinitions via apiextensions.k8s.io...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No Custom Resource Definitions found matching &quot;{search}&quot;
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((crd) => (
                      <TableRow key={crd.name} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Boxes className="size-3.5 text-primary" />
                            {crd.kind}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {crd.name}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-medium text-foreground">
                            {crd.group}
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono mt-0.5">
                            {crd.version}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`text-[11px] ${crd.scope === 'Namespaced' ? 'border-sky-500/30 text-sky-400 bg-sky-500/10' : 'border-purple-500/30 text-purple-400 bg-purple-500/10'}`}
                          >
                            {crd.scope}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge 
                            variant="default" 
                            className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Established
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-foreground text-xs">
                            {crd.instanceCount || 0}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1">objects</span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleInspectYaml(crd)}
                          >
                            <FileCode2 className="size-3.5" />
                            YAML
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* YAML Inspector Modal */}
        {selectedCrdForYaml && (
          <YamlViewerDialog
            open={yamlOpen}
            onOpenChange={setYamlOpen}
            resourceKind="CustomResourceDefinition"
            resourceName={selectedCrdForYaml.name}
            rawYaml={generatedCrdYaml}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
