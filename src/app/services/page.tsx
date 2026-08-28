"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiClient, Service, Ingress } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Network, 
  MoreHorizontal,
  RefreshCw,
  Search,
  ExternalLink,
  Globe,
  Lock,
  Trash2,
  Download,
  Copy,
  FileCode2,
  Layers,
  ArrowUpRight
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
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"><Lock className="w-3 h-3 mr-1" />{type}</Badge>
      case 'nodeport':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400"><Network className="w-3 h-3 mr-1" />{type}</Badge>
      case 'loadbalancer':
        return <Badge variant="outline" className="border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"><Globe className="w-3 h-3 mr-1" />{type}</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
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
      <div className="space-y-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Services & Ingress</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage network routing, LoadBalancers, ClusterIPs, NodePorts, and Ingress hosts</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Services</CardTitle>
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                <Network className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{services.length}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Cluster networking</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ClusterIP</CardTitle>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <Lock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-blue-600">{clusterIPCount}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Internal endpoints</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">LoadBalancers</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600">
                <Globe className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-emerald-600">{loadBalancerCount}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">External IP assigned</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresses</CardTitle>
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                <ExternalLink className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-orange-600">{ingresses.length}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">HTTP/HTTPS route rules</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or namespace..."
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 h-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm"
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 h-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm"
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
        <Tabs defaultValue="services" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-72 p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur rounded-2xl">
            <TabsTrigger value="services" className="rounded-xl py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Services ({filteredServices.length})
            </TabsTrigger>
            <TabsTrigger value="ingresses" className="rounded-xl py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Ingresses ({filteredIngresses.length})
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${svc.namespace}-${svc.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-purple-500" />
                          <span>{svc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{svc.namespace}</Badge></TableCell>
                      <TableCell>{getTypeBadge(svc.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{svc.clusterIP}</span>
                          {svc.clusterIP !== 'None' && (
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(svc.clusterIP)} className="h-6 w-6 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {svc.externalIPs.length > 0 ? (
                          <div className="flex items-center gap-1 font-mono text-xs text-emerald-600">
                            <span>{svc.externalIPs.join(', ')}</span>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(svc.externalIPs[0])} className="h-6 w-6 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{svc.ports}</TableCell>
                      <TableCell className="text-xs text-slate-500">{svc.age}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setYamlDialog({ open: true, kind: 'Service', name: svc.name, namespace: svc.namespace })}
                            className="h-8 text-xs rounded-lg"
                          >
                            <FileCode2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete('Service', svc.name, svc.namespace)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${ing.namespace}-${ing.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-orange-500" />
                          <span>{ing.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{ing.namespace}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {ing.hosts.map(h => (
                            <Badge key={h} variant="outline" className="text-xs font-mono">
                              {h}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs font-mono text-slate-600 dark:text-slate-300">
                          {ing.paths.map((p, i) => (
                            <div key={i}>
                              <span className="text-orange-600">{p.path}</span> → <strong>{p.backend}:{p.port}</strong>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ing.tls ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' : 'border-slate-400 text-slate-400'}>
                          {ing.tls ? 'TLS Enabled' : 'None'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{ing.age}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setYamlDialog({ open: true, kind: 'Ingress', name: ing.name, namespace: ing.namespace })}
                            className="h-8 text-xs rounded-lg"
                          >
                            <FileCode2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete('Ingress', ing.name, ing.namespace)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
