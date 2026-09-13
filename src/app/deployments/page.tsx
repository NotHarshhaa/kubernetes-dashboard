"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient, Deployment } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Database, 
  MoreHorizontal,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Trash2,
  Download,
  RotateCcw,
  Sliders,
  FileCode2,
  Layers,
  GitBranch
} from "lucide-react"

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeployments, setSelectedDeployments] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Scale Modal
  const [scaleDialog, setScaleDialog] = useState<{
    open: boolean
    deployment: Deployment | null
    replicas: number
  }>({
    open: false,
    deployment: null,
    replicas: 1
  })

  // YAML Modal
  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    name: string
    namespace: string
  }>({
    open: false,
    name: '',
    namespace: 'default'
  })

  const { success, error: showError, info } = useToast()

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getDeployments(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setDeployments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchDeployments, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchDeployments])

  const handleScaleDeployment = async () => {
    if (!scaleDialog.deployment) return
    try {
      await apiClient.scaleDeployment(
        scaleDialog.deployment.name,
        scaleDialog.deployment.namespace,
        scaleDialog.replicas
      )
      success(`Deployment ${scaleDialog.deployment.name} scaled to ${scaleDialog.replicas} replicas`)
      setScaleDialog({ open: false, deployment: null, replicas: 1 })
      fetchDeployments()
    } catch (error) {
      showError(`Failed to scale deployment`)
    }
  }

  const handleRestartDeployment = async (d: Deployment) => {
    try {
      await apiClient.restartDeployment(d.name, d.namespace)
      success(`Restart initiated for deployment ${d.name}`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to restart deployment ${d.name}`)
    }
  }

  const handleDeleteDeployment = async (d: Deployment) => {
    if (!confirm(`Delete deployment ${d.name} in namespace ${d.namespace}?`)) return
    try {
      await apiClient.deleteResource('Deployment', d.name, d.namespace)
      success(`Deployment ${d.name} deleted`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to delete deployment ${d.name}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDeployments.size === 0) {
      info('No deployments selected')
      return
    }
    if (!confirm(`Delete ${selectedDeployments.size} selected deployments?`)) return
    try {
      for (const key of Array.from(selectedDeployments)) {
        const [ns, name] = key.split(':')
        await apiClient.deleteResource('Deployment', name, ns)
      }
      success(`${selectedDeployments.size} deployments deleted`)
      setSelectedDeployments(new Set())
      fetchDeployments()
    } catch (error) {
      showError('Bulk delete failed')
    }
  }

  const toggleSelection = (key: string) => {
    setSelectedDeployments(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => {
    if (selectedDeployments.size === filteredDeployments.length) {
      setSelectedDeployments(new Set())
    } else {
      setSelectedDeployments(new Set(filteredDeployments.map(d => `${d.namespace}:${d.name}`)))
    }
  }

  const exportDeploymentData = () => {
    const csvContent = [
      ['Name', 'Namespace', 'Replicas', 'Ready', 'Available', 'Images', 'Age'],
      ...filteredDeployments.map(d => [
        d.name,
        d.namespace,
        d.replicas.toString(),
        d.readyReplicas.toString(),
        d.availableReplicas.toString(),
        d.images.join('; '),
        d.age || '-'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deployments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    success('Deployment data exported successfully')
  }

  const getStatusBadge = (d: Deployment) => {
    if (d.readyReplicas === d.replicas && d.replicas > 0) {
      return (
        <Badge variant="success" className="text-xs gap-1 py-0.5">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Ready
        </Badge>
      )
    } else if (d.readyReplicas > 0) {
      return (
        <Badge variant="warning" className="text-xs gap-1 py-0.5">
          <Clock className="size-3" />
          Progressing
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="text-xs gap-1 py-0.5">
          <AlertTriangle className="size-3" />
          Not Ready
        </Badge>
      )
    }
  }

  const filteredDeployments = deployments.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "ready" && d.readyReplicas === d.replicas) ||
                         (statusFilter === "progressing" && d.readyReplicas > 0 && d.readyReplicas < d.replicas) ||
                         (statusFilter === "notready" && d.readyReplicas === 0)
    return matchesSearch && matchesStatus
  })

  const readyDeployments = deployments.filter(d => d.readyReplicas === d.replicas).length
  const progressingDeployments = deployments.filter(d => d.readyReplicas > 0 && d.readyReplicas < d.replicas).length
  const totalReplicas = deployments.reduce((acc, d) => acc + d.replicas, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Database className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Deployments</h1>
                <p className="text-muted-foreground text-xs">Stateless workloads, rolling rollout restarts, horizontal replica scaling, and revision history</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "border-primary text-primary" : ""}
            >
              <RefreshCw className={`size-3.5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Auto Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportDeploymentData}>
              <Download className="size-3.5 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={fetchDeployments}>
              <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Deployments</CardTitle>
              <div className="p-2 rounded-xl bg-muted text-foreground border border-border/50">
                <Database className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{deployments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all namespaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ready / Healthy</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{readyDeployments}</div>
              <p className="text-xs text-muted-foreground mt-1">Fully provisioned replicas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Rollout</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{progressingDeployments}</div>
              <p className="text-xs text-muted-foreground mt-1">Active rollout progression</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Replicas</CardTitle>
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Zap className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{totalReplicas}</div>
              <p className="text-xs text-muted-foreground mt-1">Desired pod allocations</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search deployments..."
                  className="pl-9 h-8.5"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                >
                  <option value="all">All Namespaces</option>
                  {Array.from(new Set(deployments.map(d => d.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>

                <select
                  className="h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="ready">Ready (100%)</option>
                  <option value="progressing">Progressing</option>
                  <option value="notready">Not Ready</option>
                </select>

                {selectedDeployments.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="h-8.5 px-3 shadow-xs"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete ({selectedDeployments.size})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <Checkbox 
                      checked={selectedDeployments.size === filteredDeployments.length && filteredDeployments.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Deployment Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Replicas</TableHead>
                  <TableHead>Container Images</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.map((d) => {
                  const depKey = `${d.namespace}:${d.name}`
                  const isSelected = selectedDeployments.has(depKey)
                  
                  return (
                    <TableRow
                      key={depKey}
                      className={isSelected ? 'bg-muted/60' : ''}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(depKey)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Database className="size-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{d.name}</span>
                        </div>
                        {d.gitops && (
                          <div className="mt-1 flex items-center gap-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1 py-0 h-4 border font-mono ${
                                d.gitops.manager === 'argocd' 
                                  ? 'border-orange-500/40 text-orange-400 bg-orange-500/10' 
                                  : 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                              }`}
                            >
                              <GitBranch className="size-2.5 mr-1" />
                              {d.gitops.manager === 'argocd' ? 'ArgoCD' : 'Flux'}: {d.gitops.applicationName}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{d.namespace}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(d)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold">{d.readyReplicas}/{d.replicas}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[220px] truncate" title={d.images.join(', ')}>
                        {d.images.join(', ')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.age}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setScaleDialog({
                                open: true,
                                deployment: d,
                                replicas: d.replicas
                              })
                            }
                            className="h-7.5 text-xs shadow-xs"
                          >
                            <Sliders className="size-3.5 mr-1" /> Scale
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="size-7.5 rounded-lg p-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRestartDeployment(d)}>
                                <RotateCcw className="size-3.5 mr-2" /> Rolling Restart
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: d.name, namespace: d.namespace })}>
                                <FileCode2 className="size-3.5 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleDeleteDeployment(d)}>
                                <Trash2 className="size-3.5 mr-2" /> Delete Deployment
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

        {/* Scale Dialog */}
        <Dialog open={scaleDialog.open} onOpenChange={open => setScaleDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="size-4.5 text-primary" />
                <span>Scale Deployment:</span>
                <span className="font-mono text-primary">{scaleDialog.deployment?.name}</span>
              </DialogTitle>
              <DialogDescription>
                Adjust desired replica count for namespace <span className="font-mono">{scaleDialog.deployment?.namespace}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {scaleDialog.deployment?.gitops && (
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>
                      Tracked by {scaleDialog.deployment.gitops.manager === 'argocd' ? 'ArgoCD' : 'FluxCD'} ({scaleDialog.deployment.gitops.applicationName})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ⚠️ Imperative manual scaling will be overwritten on the next GitOps automated synchronization loop. Commit your changes to the Git repository for permanent changes.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Target Replicas</span>
                <span className="text-2xl font-bold text-primary font-mono">{scaleDialog.replicas}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setScaleDialog(prev => ({ ...prev, replicas: Math.max(0, prev.replicas - 1) }))}
                  className="size-8"
                >
                  -
                </Button>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scaleDialog.replicas}
                  onChange={e => setScaleDialog(prev => ({ ...prev, replicas: parseInt(e.target.value) || 0 }))}
                  className="flex-1 accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setScaleDialog(prev => ({ ...prev, replicas: prev.replicas + 1 }))}
                  className="size-8"
                >
                  +
                </Button>
              </div>

              {/* Quick Stepper Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                {[0, 1, 2, 3, 5, 10].map(count => (
                  <Button
                    key={count}
                    variant={scaleDialog.replicas === count ? "default" : "outline"}
                    size="xs"
                    onClick={() => setScaleDialog(prev => ({ ...prev, replicas: count }))}
                    className="font-mono"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setScaleDialog(prev => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleScaleDeployment}>
                Apply Scale
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* YAML Dialog */}
        <YamlViewerDialog
          open={yamlDialog.open}
          onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
          resourceKind="Deployment"
          resourceName={yamlDialog.name}
          namespace={yamlDialog.namespace}
        />
      </div>
    </DashboardLayout>
  )
}
