"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { apiClient, Pod } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { PodLogsDialog } from "@/components/pod-logs-dialog"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Activity, 
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
  Server,
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
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
      case 'failed':
      case 'crashloopbackoff':
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
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
      <div className="space-y-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Pods</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Live container instances, health checks, metrics, and terminal log stream</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`rounded-xl ${autoRefresh ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live Streaming' : 'Auto Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPodData} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchPods} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pods</CardTitle>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <Container className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{pods.length}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Across all namespaces</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Running</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-emerald-600">{runningPods}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Healthy containers</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed / CrashLoop</CardTitle>
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-red-600">{failedPods}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Require attention</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Restarts</CardTitle>
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-orange-600">{totalRestarts}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Pod lifecycle events</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search pods by name or namespace..."
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
                  {Array.from(new Set(pods.map(p => p.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 h-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm"
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
                    className="rounded-xl h-10 px-3 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedPods.size})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-12 text-center">
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
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => togglePodSelection(podKey)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Container className="h-4 w-4 text-emerald-500" />
                          <span>{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{pod.namespace}</Badge></TableCell>
                      <TableCell>{getStatusBadge(pod.status)}</TableCell>
                      <TableCell className="font-mono text-xs">{pod.ready}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{pod.restarts}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{pod.node}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{pod.ip}</TableCell>
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
                            className="h-8 text-xs rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30"
                          >
                            <Terminal className="h-3.5 w-3.5 mr-1" /> Logs
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
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
                              <DropdownMenuItem className="text-red-600" onClick={() => deletePod(pod)}>
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
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Container className="h-5 w-5 text-emerald-500" />
                Pod Details: {detailsDialog.pod?.name}
              </DialogTitle>
              <DialogDescription>
                Namespace: {detailsDialog.pod?.namespace} | Status: {detailsDialog.pod?.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Assigned Node</span>
                  <p className="font-semibold">{detailsDialog.pod?.node}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Pod IP</span>
                  <p className="font-semibold font-mono">{detailsDialog.pod?.ip}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Total Restarts</span>
                  <p className="font-semibold">{detailsDialog.pod?.restarts}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Age / Creation</span>
                  <p className="font-semibold">{detailsDialog.pod?.createdAt || '-'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-xs uppercase text-slate-500 mb-2">Containers</h4>
                <div className="space-y-2">
                  {detailsDialog.pod?.containers?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs font-mono text-slate-500">{c.image}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {c.ready ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailsDialog(prev => ({ ...prev, open: false }))} className="rounded-xl">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
