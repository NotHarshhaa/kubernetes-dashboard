"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { apiClient, Pod } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { PodLogsDialog } from "@/components/pod-logs-dialog"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Container, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Zap,
  Terminal,
  FileCode2,
  Trash2,
  Download,
  Eye,
  Layers,
  Cpu
} from "lucide-react"

export default function PodsPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPods, setSelectedPods] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Interactive Dialogs
  const [logsDialog, setLogsDialog] = useState<{
    open: boolean
    podName: string
    namespace: string
    containers: { name: string; image?: string }[]
  }>({
    open: false,
    podName: '',
    namespace: 'default',
    containers: []
  })

  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    name: string
    namespace: string
  }>({
    open: false,
    name: '',
    namespace: 'default'
  })

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    pod: Pod | null
  }>({
    open: false,
    pod: null
  })

  const { success, error: showError, info } = useToast()

  const fetchPods = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPods(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setPods(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pods')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchPods()
  }, [fetchPods])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchPods, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchPods])

  const deletePod = async (pod: Pod) => {
    if (!confirm(`Are you sure you want to delete pod ${pod.name}?`)) return
    try {
      await apiClient.deleteResource('Pod', pod.name, pod.namespace)
      success(`Pod ${pod.name} deleted successfully`)
      fetchPods()
    } catch (error) {
      showError(`Failed to delete pod ${pod.name}`)
    }
  }

  const restartPod = async (pod: Pod) => {
    try {
      await apiClient.restartPod(pod.name, pod.namespace)
      success(`Pod ${pod.name} restarted successfully`)
      fetchPods()
    } catch (error) {
      showError(`Failed to restart pod ${pod.name}`)
    }
  }

  const bulkDeletePods = async () => {
    if (selectedPods.size === 0) {
      info('No pods selected for deletion')
      return
    }
    if (!confirm(`Delete ${selectedPods.size} selected pods?`)) return
    
    try {
      const keys = Array.from(selectedPods)
      for (const key of keys) {
        const [ns, name] = key.split(':')
        await apiClient.deleteResource('Pod', name, ns)
      }
      success(`${selectedPods.size} pods deleted`)
      setSelectedPods(new Set())
      fetchPods()
    } catch (error) {
      showError('Failed to delete selected pods')
    }
  }

  const exportPodData = () => {
    const csvContent = [
      ['Name', 'Namespace', 'Status', 'Ready', 'Restarts', 'Node', 'IP', 'Created'],
      ...filteredPods.map(pod => [
        pod.name,
        pod.namespace,
        pod.status,
        pod.ready,
        pod.restarts.toString(),
        pod.node,
        pod.ip,
        pod.createdAt || '-'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pods-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    success('Pod data exported successfully')
  }

  const togglePodSelection = (podKey: string) => {
    setSelectedPods(prev => {
      const newSet = new Set(prev)
      if (newSet.has(podKey)) {
        newSet.delete(podKey)
      } else {
        newSet.add(podKey)
      }
      return newSet
    })
  }

  const selectAllPods = () => {
    if (selectedPods.size === filteredPods.length) {
      setSelectedPods(new Set())
    } else {
      setSelectedPods(new Set(filteredPods.map(pod => `${pod.namespace}:${pod.name}:${pod.node || ''}`)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return (
          <Badge variant="success" className="text-xs gap-1 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Running
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning" className="text-xs gap-1 py-0.5">
            <Clock className="size-3" />
            Pending
          </Badge>
        )
      case 'failed':
      case 'crashloopbackoff':
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs gap-1 py-0.5">
            <AlertTriangle className="size-3" />
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs">{status || 'Unknown'}</Badge>
    }
  }

  const filteredPods = pods.filter(pod => {
    const matchesSearch = pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "running" && pod.status === "Running") ||
                         (statusFilter === "failed" && ['Failed', 'CrashLoopBackOff', 'Error'].includes(pod.status)) ||
                         (statusFilter === "pending" && pod.status === 'Pending')
    return matchesSearch && matchesStatus
  })

  const runningPods = pods.filter(p => p.status === 'Running').length
  const failedPods = pods.filter(p => ['Failed', 'CrashLoopBackOff', 'Error'].includes(p.status)).length
  const totalRestarts = pods.reduce((acc, pod) => acc + (pod.restarts || 0), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Container className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Pods</h1>
                <p className="text-muted-foreground text-xs">Live container instances, health checks, terminal log stream, and interactive restarts</p>
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
              {autoRefresh ? 'Live Streaming' : 'Auto Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPodData}>
              <Download className="size-3.5 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={fetchPods}>
              <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pods</CardTitle>
              <div className="p-2 rounded-xl bg-muted text-foreground border border-border/50">
                <Container className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{pods.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all namespaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Healthy Running</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{runningPods}</div>
              <p className="text-xs text-muted-foreground mt-1">Active container workloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Failed / CrashLoop</CardTitle>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">{failedPods}</div>
              <p className="text-xs text-muted-foreground mt-1">Require diagnostics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Restarts</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Zap className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{totalRestarts}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifecycle restart events</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Table Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search pods by name or namespace..."
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
                  {Array.from(new Set(pods.map(p => p.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>

                <select
                  className="h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="running">Running Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="failed">Failed / CrashLoop</option>
                </select>

                {selectedPods.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={bulkDeletePods}
                    className="h-8.5 px-3 shadow-xs"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete ({selectedPods.size})
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
                      checked={selectedPods.size === filteredPods.length && filteredPods.length > 0}
                      onCheckedChange={selectAllPods}
                    />
                  </TableHead>
                  <TableHead>Pod Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ready</TableHead>
                  <TableHead>Restarts</TableHead>
                  <TableHead>Node</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPods.map((pod, idx) => {
                  const podKey = `${pod.namespace}:${pod.name}:${pod.node || idx}`
                  const isSelected = selectedPods.has(podKey)
                  
                  return (
                    <TableRow
                      key={podKey}
                      className={isSelected ? 'bg-muted/60' : ''}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => togglePodSelection(podKey)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Container className="size-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{pod.namespace}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(pod.status)}</TableCell>
                      <TableCell className="font-mono text-xs font-medium">{pod.ready}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{pod.restarts}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{pod.node}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{pod.ip}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setLogsDialog({
                                open: true,
                                podName: pod.name,
                                namespace: pod.namespace,
                                containers: pod.containers || [{ name: 'main' }]
                              })
                            }
                            className="h-7.5 text-xs shadow-xs"
                          >
                            <Terminal className="size-3.5 mr-1" /> Logs
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="size-7.5 rounded-lg p-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, pod })}>
                                <Eye className="size-3.5 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: pod.name, namespace: pod.namespace })}>
                                <FileCode2 className="size-3.5 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => restartPod(pod)}>
                                <RefreshCw className="size-3.5 mr-2" /> Restart Pod
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => deletePod(pod)}>
                                <Trash2 className="size-3.5 mr-2" /> Delete Pod
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

        {/* Live Logs Dialog */}
        <PodLogsDialog
          open={logsDialog.open}
          onOpenChange={open => setLogsDialog(prev => ({ ...prev, open }))}
          podName={logsDialog.podName}
          namespace={logsDialog.namespace}
          containers={logsDialog.containers}
        />

        {/* YAML Dialog */}
        <YamlViewerDialog
          open={yamlDialog.open}
          onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
          resourceKind="Pod"
          resourceName={yamlDialog.name}
          namespace={yamlDialog.namespace}
        />

        {/* Pod Details Dialog */}
        <Dialog open={detailsDialog.open} onOpenChange={open => setDetailsDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Container className="size-4.5 text-primary" />
                <span>Pod Details:</span>
                <span className="font-mono text-primary">{detailsDialog.pod?.name}</span>
              </DialogTitle>
              <DialogDescription>
                Namespace: <span className="font-mono">{detailsDialog.pod?.namespace}</span> • Status: {detailsDialog.pod?.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/30">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Host Node</span>
                  <p className="font-semibold text-xs font-mono mt-0.5">{detailsDialog.pod?.node}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Pod IP</span>
                  <p className="font-semibold text-xs font-mono mt-0.5">{detailsDialog.pod?.ip}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Restarts</span>
                  <p className="font-semibold text-xs font-mono mt-0.5">{detailsDialog.pod?.restarts}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">Creation Time</span>
                  <p className="font-semibold text-xs font-mono mt-0.5">{detailsDialog.pod?.createdAt || '-'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Containers ({detailsDialog.pod?.containers?.length || 1})
                </h4>
                <div className="space-y-2">
                  {detailsDialog.pod?.containers?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card/60">
                      <div>
                        <div className="font-semibold text-xs font-mono text-foreground">{c.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{c.image}</div>
                      </div>
                      <Badge variant={c.ready ? 'success' : 'destructive'} className="text-[10px]">
                        {c.ready ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </div>
                  ))}
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
      </div>
    </DashboardLayout>
  )
}
