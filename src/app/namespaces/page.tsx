"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient, Namespace } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Search, 
  MoreHorizontal, 
  Copy, 
  Eye, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  FileCode2,
  ShieldAlert
} from "lucide-react"

export default function NamespacesPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const { success, error: showError } = useToast()
  
  const [namespaces, setNamespaces] = useState<Namespace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<string>>(new Set())

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    namespace: Namespace | null
  }>({
    open: false,
    namespace: null
  })

  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    name: string
  }>({
    open: false,
    name: ''
  })

  const fetchNamespaces = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getNamespaces()
      setNamespaces(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch namespaces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNamespaces()
  }, [fetchNamespaces])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success("Copied to clipboard")
  }

  const handleSelect = (name: string) => {
    setSelectedNamespaces(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedNamespaces.size === filteredNamespaces.length) {
      setSelectedNamespaces(new Set())
    } else {
      setSelectedNamespaces(new Set(filteredNamespaces.map(n => n.name)))
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete namespace ${name}?`)) return
    try {
      await apiClient.deleteResource('Namespace', name, name)
      success(`Namespace ${name} deleted`)
      fetchNamespaces()
    } catch (err) {
      showError(`Failed to delete namespace ${name}`)
    }
  }

  const exportData = () => {
    const json = JSON.stringify(filteredNamespaces, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `namespaces-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    success('Exported namespaces successfully')
  }

  const filteredNamespaces = namespaces.filter(ns => {
    const matchesSearch = ns.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ns.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const activeNamespaces = namespaces.filter(n => n.status === 'Active').length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Namespaces</h1>
                  <p className="text-muted-foreground text-xs">Cluster tenancy boundaries, resource quotas, isolation scopes, and compute limits</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="size-3.5 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={fetchNamespaces}>
                <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Namespaces</CardTitle>
                <div className="p-2 rounded-xl bg-muted text-foreground border border-border/50">
                  <Layers className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">{namespaces.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Configured cluster partitions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Status</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{activeNamespaces}</div>
                <p className="text-xs text-muted-foreground mt-1">Healthy active tenants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Namespaces</CardTitle>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <ShieldAlert className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {namespaces.filter(n => n.name.startsWith('kube-')).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Protected core system partitions</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search namespaces..."
                    className="pl-9 h-8.5"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="terminating">Terminating</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">
                      <Checkbox 
                        checked={selectedNamespaces.size === filteredNamespaces.length && filteredNamespaces.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Namespace Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Resource Quotas</TableHead>
                    <TableHead>Compute Limits</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNamespaces.map((ns) => {
                    const isSelected = selectedNamespaces.has(ns.name)
                    const isSystem = ns.name.startsWith('kube-') || ns.name === 'default'
                    return (
                      <TableRow key={ns.name} className={isSelected ? 'bg-muted/60' : ''}>
                        <TableCell className="text-center">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleSelect(ns.name)}
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Layers className="size-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{ns.name}</span>
                            {isSystem && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                                system
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ns.status === 'Active' ? 'success' : 'destructive'} className="text-xs">
                            {ns.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ns.age}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          Pods: {ns.resourceQuotas?.pods || 'Unlimited'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          CPU: {ns.limits?.cpu || 'Unlimited'} • Mem: {ns.limits?.memory || 'Unlimited'}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailsDialog({ open: true, namespace: ns })}
                              className="h-7.5 text-xs shadow-xs"
                            >
                              <Eye className="size-3.5 mr-1" /> Details
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="size-7.5 rounded-lg p-0">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: ns.name })}>
                                  <FileCode2 className="size-3.5 mr-2" /> View YAML
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyToClipboard(ns.name)}>
                                  <Copy className="size-3.5 mr-2" /> Copy Name
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(ns.name)}>
                                  <Trash2 className="size-3.5 mr-2" /> Delete Namespace
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Namespace Details Dialog */}
          <Dialog open={detailsDialog.open} onOpenChange={open => setDetailsDialog(prev => ({ ...prev, open }))}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Layers className="size-4.5 text-primary" />
                  <span>Namespace:</span>
                  <span className="font-mono text-primary">{detailsDialog.namespace?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Status: {detailsDialog.namespace?.status} • Age: {detailsDialog.namespace?.age}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-1 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/30">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Pod Quota</span>
                    <p className="font-semibold font-mono text-xs mt-0.5">{detailsDialog.namespace?.resourceQuotas?.pods || 'Unlimited'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Service Quota</span>
                    <p className="font-semibold font-mono text-xs mt-0.5">{detailsDialog.namespace?.resourceQuotas?.services || 'Unlimited'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">CPU Limit</span>
                    <p className="font-semibold font-mono text-xs mt-0.5">{detailsDialog.namespace?.limits?.cpu || 'Unlimited'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Memory Limit</span>
                    <p className="font-semibold font-mono text-xs mt-0.5">{detailsDialog.namespace?.limits?.memory || 'Unlimited'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setDetailsDialog(prev => ({ ...prev, open: false }))}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* YAML Dialog */}
          <YamlViewerDialog
            open={yamlDialog.open}
            onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
            resourceKind="Namespace"
            resourceName={yamlDialog.name}
            namespace=""
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
