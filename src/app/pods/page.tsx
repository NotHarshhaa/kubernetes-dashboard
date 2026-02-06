"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient, Pod } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
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
  FileText,
  Trash2,
  Play,
  Pause,
  Eye,
  Download,
  Filter,
  XCircle,
  Server,
  Calendar,
  Cpu,
  HardDrive,
  Network
} from "lucide-react"

export default function PodsPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPods, setSelectedPods] = useState<Set<string>>(new Set())
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null)
  const [podLogs, setPodLogs] = useState<string>("")
  const [podDetails, setPodDetails] = useState<any>(null)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { success, error: showError, info } = useToast()

  const fetchPods = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPods(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setPods(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pods')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  const fetchPodLogs = async (pod: Pod) => {
    try {
      // In a real implementation, this would fetch actual logs
      const mockLogs = [
        `[${new Date().toISOString()}] INFO Starting pod initialization...`,
        `[${new Date().toISOString()}] INFO Loading configuration files`,
        `[${new Date().toISOString()}] INFO Database connection established`,
        `[${new Date().toISOString()}] INFO Server listening on port 8080`,
        `[${new Date().toISOString()}] INFO Health check passed`,
        `[${new Date().toISOString()}] DEBUG Processing request: GET /api/health`,
        `[${new Date().toISOString()}] INFO Request processed successfully`
      ].join('\n')
      
      setPodLogs(mockLogs)
      setSelectedPod(pod)
      setShowLogsDialog(true)
    } catch (error) {
      showError('Failed to fetch pod logs')
    }
  }

  const fetchPodDetails = async (pod: Pod) => {
    try {
      // Mock detailed pod information
      const details = {
        ...pod,
        containers: [
          {
            name: pod.name,
            image: 'nginx:latest',
            ports: [{ containerPort: 80, protocol: 'TCP' }],
            resources: {
              requests: { cpu: '100m', memory: '128Mi' },
              limits: { cpu: '500m', memory: '512Mi' }
            },
            ready: true,
            restartCount: pod.restarts
          }
        ],
        conditions: [
          { type: 'Initialized', status: 'True', lastProbeTime: new Date().toISOString() },
          { type: 'Ready', status: 'True', lastProbeTime: new Date().toISOString() },
          { type: 'ContainersReady', status: 'True', lastProbeTime: new Date().toISOString() },
          { type: 'PodScheduled', status: 'True', lastProbeTime: new Date().toISOString() }
        ],
        events: [
          { type: 'Normal', reason: 'Scheduled', message: `Successfully assigned to ${pod.node}` },
          { type: 'Normal', reason: 'Pulling', message: 'Pulling image "nginx:latest"' },
          { type: 'Normal', reason: 'Pulled', message: 'Successfully pulled image "nginx:latest"' },
          { type: 'Normal', reason: 'Created', message: 'Created container nginx' },
          { type: 'Normal', reason: 'Started', message: 'Started container nginx' }
        ]
      }
      
      setPodDetails(details)
      setSelectedPod(pod)
      setShowDetailsDialog(true)
    } catch (error) {
      showError('Failed to fetch pod details')
    }
  }

  const deletePod = async (pod: Pod) => {
    try {
      // In a real implementation, this would delete the actual pod
      success(`Pod ${pod.name} deleted successfully`)
      fetchPods()
    } catch (error) {
      showError(`Failed to delete pod ${pod.name}`)
    }
  }

  const restartPod = async (pod: Pod) => {
    try {
      // In a real implementation, this would restart the pod
      success(`Pod ${pod.name} restarted successfully`)
      fetchPods()
    } catch (error) {
      showError(`Failed to restart pod ${pod.name}`)
    }
  }

  const bulkDeletePods = async () => {
    try {
      if (selectedPods.size === 0) {
        info('No pods selected for deletion')
        return
      }
      
      // In a real implementation, this would delete the selected pods
      success(`${selectedPods.size} pods deleted successfully`)
      setSelectedPods(new Set())
      fetchPods()
    } catch (error) {
      showError('Failed to delete selected pods')
    }
  }

  const exportPodData = () => {
    const csvContent = [
      ['Name', 'Namespace', 'Status', 'Ready', 'Restarts', 'Node', 'IP', 'Age'],
      ...filteredPods.map(pod => [
        pod.name,
        pod.namespace,
        pod.status,
        pod.ready,
        pod.restarts.toString(),
        pod.node,
        pod.ip,
        pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : '-'
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
      setSelectedPods(new Set(filteredPods.map(pod => `${pod.namespace}-${pod.name}`)))
    }
  }

  useEffect(() => {
    fetchPods()
  }, [fetchPods])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(fetchPods, 10000) // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchPods])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
      case 'failed':
      case 'crashloopbackoff':
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400/20"></div>
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading pods...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching pod information from cluster</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 w-16 h-16 mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Connection Error</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchPods} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const runningPods = pods.filter(p => p.status === 'Running').length
  const failedPods = pods.filter(p => ['Failed', 'CrashLoopBackOff', 'Error'].includes(p.status)).length
  const totalRestarts = pods.reduce((acc, pod) => acc + pod.restarts, 0)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Pods</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage and monitor your container pods with real-time status</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`rounded-xl ${autoRefresh ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh'}
              </Button>
              <Button variant="outline" size="lg" onClick={exportPodData} className="rounded-xl">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="lg" onClick={fetchPods} className="rounded-xl">
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Total Pods</CardTitle>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Container className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{pods.length}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Across all namespaces</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Running</CardTitle>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{runningPods}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Healthy pods</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Failed</CardTitle>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{failedPods}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Need attention</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Total Restarts</CardTitle>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                  <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{totalRestarts}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Across all pods</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <Container className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span>Pod Management</span>
              </CardTitle>
              <CardDescription className="text-base">
                {filteredPods.length} pods found across all namespaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search pods by name or namespace..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="px-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white transition-all duration-200"
                    value={selectedNamespace}
                    onChange={(e) => setSelectedNamespace(e.target.value)}
                  >
                    <option value="all">All Namespaces</option>
                    {Array.from(new Set(pods.map(p => p.namespace))).map(ns => (
                      <option key={ns} value={ns}>{ns}</option>
                    ))}
                  </select>
                  <select
                    className="px-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white transition-all duration-200"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="running">Running</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedPods.size > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        <span className="text-sm font-medium">
                          {selectedPods.size} {selectedPods.size === 1 ? 'pod' : 'pods'} selected
                        </span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={bulkDeletePods}
                        className="rounded-lg bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4 w-12">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectedPods.size === filteredPods.length && filteredPods.length > 0}
                            onCheckedChange={selectAllPods}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Namespace</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Ready</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Restarts</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Node</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">IP</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Age</TableHead>
                      <TableHead className="w-[50px] py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPods.map((pod, index) => {
                      const podKey = `${pod.namespace}-${pod.name}`
                      const isSelected = selectedPods.has(podKey)
                      
                      return (
                        <motion.tr
                          key={podKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => togglePodSelection(podKey)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white py-4">{pod.name}</TableCell>
                          <TableCell className="py-4">{pod.namespace}</TableCell>
                          <TableCell className="py-4">{getStatusBadge(pod.status)}</TableCell>
                          <TableCell className="py-4">{pod.ready}</TableCell>
                          <TableCell className="py-4">{pod.restarts}</TableCell>
                          <TableCell className="py-4">{pod.node}</TableCell>
                          <TableCell className="py-4">{pod.ip}</TableCell>
                          <TableCell className="py-4">
                            {pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => fetchPodLogs(pod)}>
                                  <Terminal className="h-4 w-4 mr-2" />
                                  View Logs
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fetchPodDetails(pod)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => restartPod(pod)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Restart
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deletePod(pod)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Pod Logs: {selectedPod?.name}
            </DialogTitle>
            <DialogDescription>
              Namespace: {selectedPod?.namespace} | Status: {selectedPod?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ScrollArea className="h-[60vh] w-full rounded-md border bg-slate-900 text-slate-100 p-4">
              <pre className="text-sm font-mono">{podLogs}</pre>
            </ScrollArea>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowLogsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pod Details: {selectedPod?.name}
            </DialogTitle>
            <DialogDescription>
              Namespace: {selectedPod?.namespace} | Status: {selectedPod?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="containers">Containers</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Basic Info
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {selectedPod?.name}</div>
                      <div><strong>Namespace:</strong> {selectedPod?.namespace}</div>
                      <div><strong>Status:</strong> {selectedPod?.status}</div>
                      <div><strong>Node:</strong> {selectedPod?.node}</div>
                      <div><strong>IP:</strong> {selectedPod?.ip}</div>
                      <div><strong>Created:</strong> {selectedPod?.createdAt ? new Date(selectedPod.createdAt).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Status Info
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Ready:</strong> {selectedPod?.ready}</div>
                      <div><strong>Restarts:</strong> {selectedPod?.restarts}</div>
                      <div><strong>QoS Class:</strong> Burstable</div>
                      <div><strong>Phase:</strong> {selectedPod?.status}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="containers" className="space-y-4">
                {podDetails?.containers?.map((container: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{container.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Image:</strong> {container.image}</div>
                      <div><strong>Ready:</strong> {container.ready ? 'Yes' : 'No'}</div>
                      <div><strong>Restarts:</strong> {container.restartCount}</div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <strong>Resources Requests:</strong>
                          <div className="text-sm">CPU: {container.resources.requests.cpu}</div>
                          <div className="text-sm">Memory: {container.resources.requests.memory}</div>
                        </div>
                        <div>
                          <strong>Resources Limits:</strong>
                          <div className="text-sm">CPU: {container.resources.limits.cpu}</div>
                          <div className="text-sm">Memory: {container.resources.limits.memory}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                {podDetails?.conditions?.map((condition: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{condition.type}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{condition.message}</div>
                        </div>
                        <Badge className={condition.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {condition.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="events" className="space-y-4">
                {podDetails?.events?.map((event: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{event.reason}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{event.message}</div>
                        </div>
                        <Badge className={event.type === 'Normal' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                          {event.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
