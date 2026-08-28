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
  FileCode2,
  ShieldCheck,
  Check
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
  const [copiedText, setCopiedText] = useState<string | null>(null)

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
    setCopiedText(text)
    success('Copied to clipboard')
    setTimeout(() => setCopiedText(null), 2000)
  }

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clusterip':
        return (
          <Badge variant="info" className="text-xs gap-1 py-0.5 font-mono">
            <Lock className="size-3" />
            {type}
          </Badge>
        )
      case 'nodeport':
        return (
          <Badge variant="purple" className="text-xs gap-1 py-0.5 font-mono">
            <Network className="size-3" />
            {type}
          </Badge>
        )
      case 'loadbalancer':
        return (
          <Badge variant="success" className="text-xs gap-1 py-0.5 font-mono">
            <Globe className="size-3" />
            {type}
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs font-mono">{type}</Badge>
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
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Network className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Services & Ingress</h1>
                <p className="text-muted-foreground text-xs">Internal microservice networking, external LoadBalancers, NodePorts, and Ingress routing rules</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={fetchData}>
              <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Services</CardTitle>
              <div className="p-2 rounded-xl bg-muted text-foreground border border-border/50">
                <Network className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{services.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cluster networking endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ClusterIP</CardTitle>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Lock className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">{clusterIPCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Internal routing endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LoadBalancers</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Globe className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{loadBalancerCount}</div>
              <p className="text-xs text-muted-foreground mt-1">External public endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingress Gateways</CardTitle>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <ShieldCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{ingresses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">HTTP/HTTPS route hosts</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by service name or namespace..."
              className="pl-9 h-8.5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              className="h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary shadow-xs"
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>

            <select
              className="h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary shadow-xs"
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
          <TabsList className="grid grid-cols-2 w-80 h-auto p-1">
            <TabsTrigger value="services" className="font-semibold">
              Services ({filteredServices.length})
            </TabsTrigger>
            <TabsTrigger value="ingresses" className="font-semibold">
              Ingresses ({filteredIngresses.length})
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cluster IP</TableHead>
                    <TableHead>External Endpoints</TableHead>
                    <TableHead>Target Ports</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map(svc => (
                    <TableRow key={`${svc.namespace}-${svc.name}`}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Network className="size-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{svc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{svc.namespace}</Badge>
                      </TableCell>
                      <TableCell>{getTypeBadge(svc.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <span>{svc.clusterIP}</span>
                          {svc.clusterIP !== 'None' && (
                            <Button size="icon-xs" variant="ghost" onClick={() => copyToClipboard(svc.clusterIP)} className="size-6 p-0">
                              {copiedText === svc.clusterIP ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {svc.externalIPs.length > 0 ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>{svc.externalIPs.join(', ')}</span>
                            <Button size="icon-xs" variant="ghost" onClick={() => copyToClipboard(svc.externalIPs[0])} className="size-6 p-0">
                              {copiedText === svc.externalIPs[0] ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{svc.ports}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{svc.age}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setYamlDialog({ open: true, kind: 'Service', name: svc.name, namespace: svc.namespace })}
                            className="size-7.5 rounded-lg shadow-xs"
                            title="View YAML"
                          >
                            <FileCode2 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete('Service', svc.name, svc.namespace)}
                            className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                            title="Delete Service"
                          >
                            <Trash2 className="size-3.5" />
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
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingress Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Hosts</TableHead>
                    <TableHead>Routing Paths & Backends</TableHead>
                    <TableHead>TLS Security</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngresses.map(ing => (
                    <TableRow key={`${ing.namespace}-${ing.name}`}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Globe className="size-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{ing.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{ing.namespace}</Badge>
                      </TableCell>
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
                        <div className="space-y-1 text-xs font-mono text-muted-foreground">
                          {ing.paths.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-primary font-semibold">{p.path}</span>
                              <span>→</span>
                              <Badge variant="outline" className="text-[10px]">{p.backend}:{p.port}</Badge>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ing.tls ? 'success' : 'secondary'} className="text-xs">
                          {ing.tls ? 'TLS Enabled' : 'Plain HTTP'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ing.age}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setYamlDialog({ open: true, kind: 'Ingress', name: ing.name, namespace: ing.namespace })}
                            className="size-7.5 rounded-lg shadow-xs"
                            title="View YAML"
                          >
                            <FileCode2 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete('Ingress', ing.name, ing.namespace)}
                            className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                            title="Delete Ingress"
                          >
                            <Trash2 className="size-3.5" />
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
