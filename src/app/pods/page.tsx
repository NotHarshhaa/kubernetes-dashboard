"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Zap,
  Terminal,
  FileCode2,
  Trash2,
  Download,
  Eye
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
      setSelectedPods(new Set(filteredPods.map(pod => `${pod.namespace}:${pod.name}`)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return <Badge variant="default" className="text-xs gap-1"><CheckCircle className="w-3 h-3" />{status}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs gap-1"><Clock className="w-3 h-3" />{status}</Badge>
      case 'failed':
      case 'crashloopbackoff':
      case 'error':
        return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />{status}</Badge>
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
            <div className="flex items-center gap-2.5">
              <Container className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pods</h1>
                <p className="text-muted-foreground text-sm">Live container instances, health checks, metrics, and terminal log stream</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Auto Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPodData}>
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchPods}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Pods</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Container className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{pods.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all namespaces</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Running</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{runningPods}</div>
              <p className="text-xs text-muted-foreground mt-1">Healthy containers</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failed / CrashLoop</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-destructive">{failedPods}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Restarts</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{totalRestarts}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifecycle events</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search pods..."
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
                  {Array.from(new Set(pods.map(p => p.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>

                <select
                  className="h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="running">Running</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                {selectedPods.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={bulkDeletePods}
                    className="h-9 px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPods.map((pod) => {
                  const podKey = `${pod.namespace}:${pod.name}`
                  const isSelected = selectedPods.has(podKey)
                  
                  return (
                    <TableRow
                      key={podKey}
                      className={isSelected ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => togglePodSelection(podKey)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Container className="h-4 w-4 text-muted-foreground" />
                          <span>{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{pod.namespace}</Badge></TableCell>
                      <TableCell>{getStatusBadge(pod.status)}</TableCell>
                      <TableCell className="font-mono text-xs">{pod.ready}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{pod.restarts}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{pod.node}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{pod.ip}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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
                            className="h-8 text-xs"
                          >
                            <Terminal className="h-3.5 w-3.5 mr-1" /> Logs
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, pod })}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: pod.name, namespace: pod.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => restartPod(pod)}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Restart Pod
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deletePod(pod)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Pod
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
                <Container className="h-4 w-4 text-primary" />
                Pod Details: {detailsDialog.pod?.name}
              </DialogTitle>
              <DialogDescription>
                Namespace: {detailsDialog.pod?.namespace} | Status: {detailsDialog.pod?.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/40">
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Node</span>
                  <p className="font-semibold">{detailsDialog.pod?.node}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">IP</span>
                  <p className="font-semibold font-mono">{detailsDialog.pod?.ip}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Restarts</span>
                  <p className="font-semibold">{detailsDialog.pod?.restarts}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Creation</span>
                  <p className="font-semibold">{detailsDialog.pod?.createdAt || '-'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Containers</h4>
                <div className="space-y-1.5">
                  {detailsDialog.pod?.containers?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-md border">
                      <div>
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{c.image}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {c.ready ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setDetailsDialog(prev => ({ ...prev, open: false }))}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
