"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { apiClient, Service, Ingress } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Network, 
  RefreshCw,
  Search,
  Globe,
  Lock,
  Trash2,
  Copy,
  FileCode2
} from "lucide-react"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [ingresses, setIngresses] = useState<Ingress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("services")

  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    kind: string
    name: string
    namespace: string
  }>({
    open: false,
    kind: 'Service',
    name: '',
    namespace: 'default'
  })

  const { success, error: showError } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [svcList, ingList] = await Promise.all([
        apiClient.getServices(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getIngresses(selectedNamespace === 'all' ? undefined : selectedNamespace)
      ])
      setServices(svcList)
      setIngresses(ingList)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    if (!confirm(`Are you sure you want to delete ${kind} ${name}?`)) return
    try {
      await apiClient.deleteResource(kind, name, namespace)
      success(`${kind} ${name} deleted`)
      fetchData()
    } catch (error) {
      showError(`Failed to delete ${kind}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
  }

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clusterip':
        return <Badge variant="default" className="text-xs gap-1"><Lock className="w-3 h-3" />{type}</Badge>
      case 'nodeport':
        return <Badge variant="secondary" className="text-xs gap-1"><Network className="w-3 h-3" />{type}</Badge>
      case 'loadbalancer':
        return <Badge variant="outline" className="text-xs gap-1"><Globe className="w-3 h-3" />{type}</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || service.type.toLowerCase() === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const filteredIngresses = ingresses.filter(ing => {
    return ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ing.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const clusterIPCount = services.filter(s => s.type === 'ClusterIP').length
  const loadBalancerCount = services.filter(s => s.type === 'LoadBalancer').length
  const namespaces = Array.from(new Set([...services.map(s => s.namespace), ...ingresses.map(i => i.namespace)]))

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Network className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Services & Ingress</h1>
                <p className="text-muted-foreground text-sm">Manage network routing, LoadBalancers, ClusterIPs, NodePorts, and Ingress hosts</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Services</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Network className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{services.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cluster networking</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ClusterIP</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Lock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{clusterIPCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Internal endpoints</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">LoadBalancers</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Globe className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{loadBalancerCount}</div>
              <p className="text-xs text-muted-foreground mt-1">External endpoints</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingresses</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Network className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{ingresses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Route rules</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border bg-card">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or namespace..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>

            <select
              className="h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="clusterip">ClusterIP</option>
              <option value="nodeport">NodePort</option>
              <option value="loadbalancer">LoadBalancer</option>
            </select>
          </div>
        </div>

        {/* Tabs for Services & Ingresses */}
        <Tabs defaultValue="services" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-72 h-auto p-1">
            <TabsTrigger value="services">
              Services ({filteredServices.length})
            </TabsTrigger>
            <TabsTrigger value="ingresses">
              Ingresses ({filteredIngresses.length})
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cluster IP</TableHead>
                    <TableHead>External Endpoints</TableHead>
                    <TableHead>Ports</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map(svc => (
                    <TableRow key={`${svc.namespace}-${svc.name}`}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-muted-foreground" />
                          <span>{svc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{svc.namespace}</Badge></TableCell>
                      <TableCell>{getTypeBadge(svc.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-muted-foreground">{svc.clusterIP}</span>
                          {svc.clusterIP !== 'None' && (
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(svc.clusterIP)} className="h-6 w-6 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {svc.externalIPs.length > 0 ? (
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span>{svc.externalIPs.join(', ')}</span>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(svc.externalIPs[0])} className="h-6 w-6 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{svc.ports}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{svc.age}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setYamlDialog({ open: true, kind: 'Service', name: svc.name, namespace: svc.namespace })}
                            className="h-8 w-8 p-0"
                          >
                            <FileCode2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete('Service', svc.name, svc.namespace)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Ingresses Tab */}
          <TabsContent value="ingresses">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingress Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Hosts</TableHead>
                    <TableHead>Paths & Backends</TableHead>
                    <TableHead>TLS</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngresses.map(ing => (
                    <TableRow key={`${ing.namespace}-${ing.name}`}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{ing.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ing.namespace}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {ing.hosts.map(h => (
                            <Badge key={h} variant="secondary" className="text-xs font-mono">
                              {h}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs font-mono text-muted-foreground">
                          {ing.paths.map((p, i) => (
                            <div key={i}>
                              <span className="text-primary font-semibold">{p.path}</span> → {p.backend}:{p.port}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ing.tls ? 'default' : 'secondary'} className="text-xs">
                          {ing.tls ? 'TLS' : 'None'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ing.age}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setYamlDialog({ open: true, kind: 'Ingress', name: ing.name, namespace: ing.namespace })}
                            className="h-8 w-8 p-0"
                          >
                            <FileCode2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete('Ingress', ing.name, ing.namespace)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* YAML Dialog */}
        <YamlViewerDialog
          open={yamlDialog.open}
          onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
          resourceKind={yamlDialog.kind}
          resourceName={yamlDialog.name}
          namespace={yamlDialog.namespace}
        />
      </div>
    </DashboardLayout>
  )
}
