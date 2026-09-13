"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { apiClient, GatewayItem, HTTPRouteItem } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Network, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  FileCode2, 
  Layers, 
  ArrowRight,
  Globe,
  Radio,
  Server,
  Zap,
  Route
} from "lucide-react"

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<GatewayItem[]>([])
  const [routes, setRoutes] = useState<HTTPRouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<'gateways' | 'routes'>('gateways')
  const [search, setSearch] = useState("")
  const [selectedItemForYaml, setSelectedItemForYaml] = useState<{ kind: string; name: string; yaml: string } | null>(null)
  const [yamlOpen, setYamlOpen] = useState(false)
  const { error: showError } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const ns = selectedNamespace === 'all' ? undefined : selectedNamespace
      const [gwData, rtData] = await Promise.all([
        apiClient.getGateways(ns),
        apiClient.getHTTPRoutes(ns)
      ])
      setGateways(gwData)
      setRoutes(rtData)
    } catch (err) {
      showError(`Failed to load Gateway API resources: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, showError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredGateways = gateways.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.gatewayClassName.toLowerCase().includes(search.toLowerCase()) ||
    g.namespace.toLowerCase().includes(search.toLowerCase())
  )

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.hostnames.some(h => h.toLowerCase().includes(search.toLowerCase())) ||
    r.parentGateways.some(p => p.toLowerCase().includes(search.toLowerCase())) ||
    r.namespace.toLowerCase().includes(search.toLowerCase())
  )

  const programmedCount = gateways.filter(g => g.status === 'Programmed').length

  const handleInspectYaml = (kind: string, item: any) => {
    const yaml = `apiVersion: gateway.networking.k8s.io/v1
kind: ${kind}
metadata:
  name: ${item.name}
  namespace: ${item.namespace}
  creationTimestamp: "${item.creationTimestamp}"
  labels:
    app.kubernetes.io/managed-by: kubernetes-dashboard
spec:
${JSON.stringify(item, null, 2)}
status:
  conditions:
    - type: Accepted
      status: "True"
`
    setSelectedItemForYaml({ kind, name: item.name, yaml })
    setYamlOpen(true)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Network className="size-6 text-primary" />
                  Gateway API
                </h2>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">
                  gateway.networking.k8s.io/v1
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Next-generation Kubernetes ingress, service mesh connectivity, and layer-7 routing architecture
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Namespace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Namespaces</SelectItem>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="gateway-system">gateway-system</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
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
                  Gateways
                </CardTitle>
                <Network className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gateways.length}</div>
                <p className="text-xs text-muted-foreground">{programmedCount} programmed on dataplane</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  HTTPRoutes
                </CardTitle>
                <Route className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes.length}</div>
                <p className="text-xs text-muted-foreground">Active routing policy rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Gateway Classes
                </CardTitle>
                <Server className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">cilium-gateway, envoy-internal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ingress Evolution
                </CardTitle>
                <Zap className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">Modern</div>
                <p className="text-xs text-muted-foreground">Role-oriented multi-tenant model</p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation & Search */}
          <Card>
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('gateways')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'gateways'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Network className="size-3.5" />
                    Gateways ({gateways.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('routes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'routes'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Route className="size-3.5" />
                    HTTPRoutes ({routes.length})
                  </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab === 'gateways' ? 'gateways...' : 'HTTPRoutes...'}`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {activeTab === 'gateways' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>GatewayClass</TableHead>
                      <TableHead>Listeners</TableHead>
                      <TableHead>Assigned Addresses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <RefreshCw className="size-5 animate-spin inline mr-2 text-primary" />
                          Loading Gateways...
                        </TableCell>
                      </TableRow>
                    ) : filteredGateways.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          No Gateways found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGateways.map((gw) => (
                        <TableRow key={gw.name} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Radio className="size-3.5 text-primary" />
                              {gw.name}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {gw.namespace}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded">
                              {gw.gatewayClassName}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {gw.listeners.map((l, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                                  {l.protocol}:{l.port}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {gw.addresses.length > 0 ? gw.addresses.join(', ') : 'Pending allocation'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="default"
                              className={`text-[11px] ${
                                gw.status === 'Programmed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              <CheckCircle2 className="size-3 mr-1" />
                              {gw.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => handleInspectYaml('Gateway', gw)}
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HTTPRoute</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Hostnames</TableHead>
                      <TableHead>Parent Gateway</TableHead>
                      <TableHead>Path Matches & Backends</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <RefreshCw className="size-5 animate-spin inline mr-2 text-primary" />
                          Loading HTTPRoutes...
                        </TableCell>
                      </TableRow>
                    ) : filteredRoutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          No HTTPRoutes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes.map((rt) => (
                        <TableRow key={rt.name} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Route className="size-3.5 text-emerald-400" />
                              {rt.name}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {rt.namespace}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rt.hostnames.map((h, i) => (
                                <span key={i} className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                                  <Globe className="size-3" />
                                  {h}
                                </span>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rt.parentGateways.map((pg, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                                  {pg}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              {rt.rules.map((rule, idx) => (
                                <div key={idx} className="text-[11px] flex items-center gap-1.5 font-mono text-muted-foreground">
                                  <span className="text-foreground font-semibold">
                                    {rule.matches?.[0]?.path?.value || '/'}
                                  </span>
                                  <ArrowRight className="size-3 text-primary" />
                                  <span>
                                    {rule.backendRefs.map(b => `${b.name}:${b.port} (${b.weight || 100}%)`).join(', ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="default"
                              className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            >
                              <CheckCircle2 className="size-3 mr-1" />
                              {rt.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => handleInspectYaml('HTTPRoute', rt)}
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* YAML Inspector Modal */}
        {selectedItemForYaml && (
          <YamlViewerDialog
            open={yamlOpen}
            onOpenChange={setYamlOpen}
            resourceKind={selectedItemForYaml.kind}
            resourceName={selectedItemForYaml.name}
            rawYaml={selectedItemForYaml.yaml}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
