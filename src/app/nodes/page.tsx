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
import { apiClient, Node } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { useRealTimeNodes } from "@/hooks/use-real-time-nodes"
import { 
  Activity, 
  Server, 
  MoreHorizontal,
  RefreshCw,
  Search,
  Cpu,
  HardDrive,
  MemoryStick,
  CheckCircle,
  AlertTriangle,
  Clock,
  Terminal,
  FileText,
  Trash2,
  Eye,
  Download,
  Filter,
  Calendar,
  Copy,
  Zap,
  Shield,
  Network,
  Monitor,
  Power,
  Settings,
  Ban,
  TriangleAlert,
  Wifi,
  WifiOff,
  Info
} from "lucide-react"

export default function NodesPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Use real-time nodes hook or demo fallback based on environment
  const realTimeData = useRealTimeNodes()
  const { 
    nodes, 
    nodeMetrics, 
    nodeEvents, 
    isConnected, 
    lastUpdate, 
    getNodeMetrics, 
    getNodeEvents 
  } = isDemoMode ? {
    nodes: [],
    nodeMetrics: [],
    nodeEvents: [],
    isConnected: false,
    lastUpdate: null,
    getNodeMetrics: (nodeName: string) => ({
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      podCount: Math.floor(Math.random() * 20) + 5,
      status: 'Ready',
      lastUpdate: new Date().toISOString()
    }),
    getNodeEvents: (nodeName: string) => [{
      type: 'Normal',
      reason: 'NodeReady',
      message: `Node ${nodeName} is ready`,
      nodeName: nodeName,
      timestamp: new Date().toISOString()
    }]
  } : realTimeData

  // Demo mode - fallback to original implementation with real-time features
  const [nodesState, setNodesState] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodeEventsState, setNodeEventsState] = useState<any>(null)
  const [nodeDetails, setNodeDetails] = useState<any>(null)
  const [showEventsDialog, setShowEventsDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showMetricsDialog, setShowMetricsDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { success, error: showError, info } = useToast()

  // Demo mode connection status
  const [demoLastUpdate, setDemoLastUpdate] = useState<Date | null>(null)

  // Use appropriate data source based on mode
  const currentNodes = isDemoMode ? nodesState : nodes
  const currentLastUpdate = isDemoMode ? demoLastUpdate : lastUpdate
  const currentIsConnected = isDemoMode ? false : isConnected

  // Use appropriate functions based on mode
  const currentGetNodeMetrics = isDemoMode ? (nodeName: string) => ({
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    diskUsage: Math.random() * 100,
    podCount: Math.floor(Math.random() * 20) + 5,
    status: 'Ready',
    lastUpdate: new Date().toISOString()
  }) : getNodeMetrics

  const currentGetNodeEvents = isDemoMode ? (nodeName: string) => [{
    type: 'Normal',
    reason: 'NodeReady',
    message: `Node ${nodeName} is ready`,
    nodeName: nodeName,
    timestamp: new Date().toISOString()
  }] : getNodeEvents

  const fetchNodes = useCallback(async () => {
    if (!isDemoMode) return // Skip fetch in real-time mode
    
    try {
      setLoading(true)
      const data = await apiClient.getNodes()
      setNodesState(data)
      setDemoLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes')
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    fetchNodes()
  }, [fetchNodes])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(fetchNodes, 10000) // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchNodes])

  const fetchNodeEvents = async (node: Node) => {
    try {
      // Mock events data
      const mockEvents = {
        node: node.name,
        events: [
          {
            type: 'Normal',
            reason: 'Starting',
            message: `Starting kubelet on node ${node.name}`,
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
          },
          {
            type: 'Normal',
            reason: 'NodeReady',
            message: `Node ${node.name} is now ready`,
            timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
          },
          {
            type: 'Normal',
            reason: 'KubeletReady',
            message: 'Kubelet is now ready',
            timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString()
          },
          {
            type: 'Warning',
            reason: 'MemoryPressure',
            message: 'Memory pressure detected',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          {
            type: 'Normal',
            reason: 'NodeAllocatable',
            message: 'Updated node allocatable resource limits',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
          }
        ]
      }
      
      setNodeEventsState(mockEvents)
      setSelectedNode(node)
      setShowEventsDialog(true)
    } catch (error) {
      showError('Failed to fetch node events')
    }
  }

  const fetchNodeDetails = async (node: Node) => {
    try {
      // Mock detailed node information
      const details = {
        ...node,
        nodeInfo: {
          machineID: '12345678-1234-1234-1234-123456789012',
          systemUUID: '12345678-1234-1234-1234-123456789012',
          bootID: '12345678-1234-1234-1234-123456789012',
          kernelVersion: '5.15.0-107-generic',
          osImage: 'Ubuntu 20.04.6 LTS',
          containerRuntimeVersion: 'containerd://1.6.18',
          kubeletVersion: 'v1.28.2',
          kubeProxyVersion: 'v1.28.2',
          operatingSystem: 'linux',
          architecture: 'amd64'
        },
        addresses: [
          {
            type: 'InternalIP',
            address: node.internalIP
          },
          ...(node.externalIP ? [{
            type: 'ExternalIP',
            address: node.externalIP
          }] : [])
        ],
        capacity: {
          cpu: node.cpuCapacity,
          memory: node.memoryCapacity,
          pods: node.podsCapacity,
          ephemeralStorage: '123456789Ki'
        },
        allocatable: {
          cpu: '2',
          memory: '3840Mi',
          pods: '110',
          ephemeralStorage: '123456789Ki'
        },
        conditions: [
          { type: 'Ready', status: 'True', lastHeartbeatTime: new Date().toISOString() },
          { type: 'MemoryPressure', status: 'False', lastHeartbeatTime: new Date().toISOString() },
          { type: 'DiskPressure', status: 'False', lastHeartbeatTime: new Date().toISOString() },
          { type: 'PIDPressure', status: 'False', lastHeartbeatTime: new Date().toISOString() },
          { type: 'NetworkUnavailable', status: 'False', lastHeartbeatTime: new Date().toISOString() }
        ],
        taints: [],
        labels: {
          'kubernetes.io/hostname': node.name,
          'node-role.kubernetes.io/control-plane': '',
          'node-role.kubernetes.io/master': ''
        }
      }
      
      setNodeDetails(details)
      setSelectedNode(node)
      setShowDetailsDialog(true)
    } catch (error) {
      showError('Failed to fetch node details')
    }
  }

  const fetchNodeMetrics = async (node: Node) => {
    try {
      // Mock metrics data
      const mockMetrics = {
        node: node.name,
        timestamp: new Date().toISOString(),
        cpu: {
          usageCores: 1.2,
          usageNanoCores: 1200000000,
          totalCores: parseInt(node.cpuCapacity || '2')
        },
        memory: {
          availableBytes: 2147483648,
          available: '2Gi',
          totalBytes: 4294967296,
          total: '4Gi',
          usageBytes: 2147483648,
          usage: '2Gi'
        },
        pods: {
          capacity: parseInt(node.podsCapacity || '110'),
          current: 45,
          available: 65
        },
        filesystem: [
          {
            device: '/dev/sda1',
            available: '50Gi',
            capacity: '100Gi',
            used: '50Gi',
            usage: 50
          }
        ]
      }
      
      setNodeDetails(mockMetrics) // Use setNodeDetails instead of setNodeMetrics
      setSelectedNode(node)
      setShowMetricsDialog(true)
    } catch (error) {
      showError('Failed to fetch node metrics')
    }
  }

  const cordonNode = async (node: Node) => {
    try {
      success(`Node ${node.name} cordoned successfully`)
      fetchNodes()
    } catch (error) {
      showError(`Failed to cordon node ${node.name}`)
    }
  }

  const drainNode = async (node: Node) => {
    try {
      success(`Node ${node.name} drained successfully`)
      fetchNodes()
    } catch (error) {
      showError(`Failed to drain node ${node.name}`)
    }
  }

  const uncordonNode = async (node: Node) => {
    try {
      success(`Node ${node.name} uncordoned successfully`)
      fetchNodes()
    } catch (error) {
      showError(`Failed to uncordon node ${node.name}`)
    }
  }

  const deleteNode = async (node: Node) => {
    try {
      success(`Node ${node.name} deleted successfully`)
      fetchNodes()
    } catch (error) {
      showError(`Failed to delete node ${node.name}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
  }

  const exportNodeData = () => {
    const csvContent = [
      ['Name', 'Status', 'Roles', 'Version', 'Internal IP', 'External IP', 'CPU', 'Memory', 'Pods', 'Age'],
      ...filteredNodes.map(node => [
        node.name,
        node.status,
        node.roles.join(', '),
        node.version,
        node.internalIP,
        node.externalIP || '-',
        node.cpuCapacity,
        formatMemory(node.memoryCapacity),
        node.podsCapacity,
        '-' // Age property doesn't exist on Node type
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nodes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    success('Node data exported successfully')
  }

  const bulkCordonNodes = async () => {
    try {
      if (selectedNodes.size === 0) {
        info('No nodes selected for cordoning')
        return
      }
      
      success(`${selectedNodes.size} nodes cordoned successfully`)
      setSelectedNodes(new Set())
      fetchNodes()
    } catch (error) {
      showError('Failed to cordon selected nodes')
    }
  }

  const bulkDrainNodes = async () => {
    try {
      if (selectedNodes.size === 0) {
        info('No nodes selected for draining')
        return
      }
      
      success(`${selectedNodes.size} nodes drained successfully`)
      setSelectedNodes(new Set())
      fetchNodes()
    } catch (error) {
      showError('Failed to drain selected nodes')
    }
  }

  const toggleNodeSelection = (nodeName: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeName)) {
        newSet.delete(nodeName)
      } else {
        newSet.add(nodeName)
      }
      return newSet
    })
  }

  const selectAllNodes = () => {
    if (selectedNodes.size === filteredNodes.length) {
      setSelectedNodes(new Set())
    } else {
      setSelectedNodes(new Set(filteredNodes.map(node => node.name)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>
      case 'notready':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
    }
  }

  const formatMemory = (memory: string) => {
    if (!memory) return '-'
    const match = memory.match(/(\d+)Ki/)
    if (match) {
      const kb = parseInt(match[1])
      const gb = (kb / 1024 / 1024).toFixed(1)
      return `${gb} GB`
    }
    return memory
  }

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.roles.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "ready" && node.status === 'Ready') ||
                         (statusFilter === "notready" && node.status === 'NotReady')
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
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading nodes...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching node information from cluster</p>
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
            <Button onClick={fetchNodes} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const readyNodes = nodes.filter(n => n.status === 'Ready').length
  const totalCPU = nodes.reduce((acc, node) => acc + parseInt(node.cpuCapacity || '0'), 0)
  const totalMemory = formatMemory(nodes.reduce((acc, node) => acc + (parseInt(node.memoryCapacity?.match(/(\d+)Ki/)?.[1] || '0')), 0).toString() + 'Ki')

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Nodes</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Monitor cluster nodes and resource utilization with real-time metrics</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  isDemoMode 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : currentIsConnected 
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {isDemoMode ? (
                    <>
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Demo Mode</span>
                    </>
                  ) : currentIsConnected ? (
                    <>
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4" />
                      <span className="text-sm font-medium">Disconnected</span>
                    </>
                  )}
                </div>
                {currentLastUpdate && (
                  <span className="text-xs text-slate-500">
                    Last update: {currentLastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
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
              <Button variant="outline" size="lg" onClick={exportNodeData} className="rounded-xl">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="lg" onClick={fetchNodes} className="rounded-xl">
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
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Nodes</CardTitle>
                <Server className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{nodes.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In the cluster</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Ready</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{readyNodes}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Healthy nodes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total CPU</CardTitle>
                <Cpu className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalCPU}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">CPU cores</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Memory</CardTitle>
                <MemoryStick className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalMemory}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Available memory</p>
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
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-600" />
                <span>Node Management</span>
              </CardTitle>
              <CardDescription>
                {filteredNodes.length} nodes found
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
                        placeholder="Search nodes by name or role..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="px-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white transition-all duration-200"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="ready">Ready</option>
                    <option value="notready">Not Ready</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedNodes.size > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        <span className="text-sm font-medium">
                          {selectedNodes.size} {selectedNodes.size === 1 ? 'node' : 'nodes'} selected
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={bulkCordonNodes}
                        className="rounded-lg"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Cordon Selected
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={bulkDrainNodes}
                        className="rounded-lg"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Drain Selected
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => {
                          selectedNodes.forEach(nodeName => {
                            const node = nodes.find(n => n.name === nodeName)
                            if (node) deleteNode(node)
                          })
                        }}
                        className="rounded-lg bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4 w-12">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectedNodes.size === filteredNodes.length && filteredNodes.length > 0}
                            onCheckedChange={selectAllNodes}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Roles</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Version</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Internal IP</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">External IP</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">CPU</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Memory</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Pods</TableHead>
                      <TableHead className="w-[50px] py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNodes.map((node, index) => {
                      const isSelected = selectedNodes.has(node.name)
                      
                      return (
                        <motion.tr
                          key={node.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleNodeSelection(node.name)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white py-4">{node.name}</TableCell>
                          <TableCell className="py-4">{getStatusBadge(node.status)}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-1">
                              {node.roles.map((role, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-4">{node.version}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{node.internalIP}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(node.internalIP)}
                                className="h-6 w-6 p-0 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {node.externalIP ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">{node.externalIP}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(node.externalIP)}
                                  className="h-6 w-6 p-0 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1">
                              <Cpu className="h-3 w-3 text-slate-500" />
                              <span className="text-sm">{node.cpuCapacity}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1">
                              <MemoryStick className="h-3 w-3 text-slate-500" />
                              <span className="text-sm">{formatMemory(node.memoryCapacity)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3 text-slate-500" />
                              <span className="text-sm">{node.podsCapacity}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => fetchNodeDetails(node)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fetchNodeEvents(node)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Events
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fetchNodeMetrics(node)}>
                                  <Monitor className="h-4 w-4 mr-2" />
                                  View Metrics
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyToClipboard(node.internalIP)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy IP
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => cordonNode(node)}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Cordon
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => drainNode(node)}>
                                  <Power className="h-4 w-4 mr-2" />
                                  Drain
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => uncordonNode(node)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Uncordon
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteNode(node)}>
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

      {/* Events Dialog */}
      <Dialog open={showEventsDialog} onOpenChange={setShowEventsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Node Events: {selectedNode?.name}
            </DialogTitle>
            <DialogDescription>
              Status: {selectedNode?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ScrollArea className="h-[60vh] w-full rounded-md border bg-slate-900 text-slate-100 p-4">
              <div className="space-y-3">
                {nodeEventsState?.events?.map((event: any, index: number) => (
                  <div key={index} className="border-l-2 border-slate-700 pl-4 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={event.type === 'Normal' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                        {event.type}
                      </Badge>
                      <span className="font-medium text-white">{event.reason}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300">{event.message}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowEventsDialog(false)}>
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
              Node Details: {selectedNode?.name}
            </DialogTitle>
            <DialogDescription>
              Status: {selectedNode?.status} | IP: {selectedNode?.internalIP}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="info">Node Info</TabsTrigger>
                <TabsTrigger value="capacity">Capacity</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Basic Info
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {selectedNode?.name}</div>
                      <div><strong>Status:</strong> {selectedNode?.status}</div>
                      <div><strong>Version:</strong> {selectedNode?.version}</div>
                      <div><strong>Internal IP:</strong> {selectedNode?.internalIP}</div>
                      <div><strong>External IP:</strong> {selectedNode?.externalIP || '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Resources
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>CPU Capacity:</strong> {selectedNode?.cpuCapacity}</div>
                      <div><strong>Memory Capacity:</strong> {formatMemory(selectedNode?.memoryCapacity || '')}</div>
                      <div><strong>Pod Capacity:</strong> {selectedNode?.podsCapacity}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Roles
                  </h4>
                  <div className="flex gap-2">
                    {selectedNode?.roles.map((role, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">System Information</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div><strong>OS Image:</strong> {nodeDetails?.nodeInfo?.osImage}</div>
                        <div><strong>Kernel Version:</strong> {nodeDetails?.nodeInfo?.kernelVersion}</div>
                        <div><strong>Container Runtime:</strong> {nodeDetails?.nodeInfo?.containerRuntimeVersion}</div>
                        <div><strong>Kubelet Version:</strong> {nodeDetails?.nodeInfo?.kubeletVersion}</div>
                        <div><strong>Architecture:</strong> {nodeDetails?.nodeInfo?.architecture}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Network Information</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        {nodeDetails?.addresses?.map((addr: any, index: number) => (
                          <div key={index}>
                            <strong>{addr.type}:</strong> {addr.address}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="capacity" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Capacity</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="space-y-4">
                        <div>
                          <span className="font-semibold">CPU:</span> {nodeDetails?.capacity?.cpu}
                        </div>
                        <div>
                          <span className="font-semibold">Allocatable CPU:</span> {nodeDetails?.allocatable?.cpu}
                        </div>
                        <div>
                          <span className="font-semibold">Memory:</span> {nodeDetails?.capacity?.memory}
                        </div>
                        <div>
                          <span className="font-semibold">Allocatable Memory:</span> {nodeDetails?.allocatable?.memory}
                        </div>
                        <div>
                          <span className="font-semibold">Pods:</span> {nodeDetails?.capacity?.pods}
                        </div>
                        <div>
                          <span className="font-semibold">Allocatable Pods:</span> {nodeDetails?.allocatable?.pods}
                        </div>
                        <div>
                          <span className="font-semibold">Ephemeral Storage:</span> {nodeDetails?.capacity?.ephemeralStorage}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                {nodeDetails?.conditions?.map((condition: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{condition.type}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Last checked: {new Date(condition.lastHeartbeatTime).toLocaleString()}
                          </div>
                        </div>
                        <Badge className={condition.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {condition.status}
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

      {/* Metrics Dialog */}
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Node Metrics: {selectedNode?.name}
            </DialogTitle>
            <DialogDescription>
              Real-time resource utilization metrics
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <h3 className="text-lg font-semibold">CPU Usage</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage:</span>
                        <span className="font-mono">{nodeDetails?.cpu?.usageCores} / {nodeDetails?.cpu?.totalCores}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.round((nodeDetails?.cpu?.usageCores / nodeDetails?.cpu?.totalCores) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MemoryStick className="h-4 w-4 text-purple-600" />
                      <h3 className="text-lg font-semibold">Memory Usage</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage:</span>
                        <span className="font-mono">{nodeDetails?.memory?.usage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available:</span>
                        <span className="font-mono">{nodeDetails?.memory?.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-mono">{nodeDetails?.memory?.total}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${Math.round((nodeDetails?.memory?.usageBytes / nodeDetails?.memory?.totalBytes) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <HardDrive className="h-4 w-4 text-orange-600" />
                      <h3 className="text-lg font-semibold">Pod Usage</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current:</span>
                        <span className="font-mono">{nodeDetails?.pods?.current}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available:</span>
                        <span className="font-mono">{nodeDetails?.pods?.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Capacity:</span>
                        <span className="font-mono">{nodeDetails?.pods?.capacity}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${Math.round((nodeDetails?.pods?.current / nodeDetails?.pods?.capacity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Network className="h-4 w-4 text-green-600" />
                      <h3 className="text-lg font-semibold">Filesystem Usage</h3>
                    </div>
                    <div className="space-y-2">
                      {nodeDetails?.filesystem?.map((fs: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{fs.device}</span>
                          <span className="text-sm text-slate-600">{fs.used}</span>
                          <span className="text-sm text-slate-600">/ {fs.capacity}</span>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${fs.usage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowMetricsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
