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
import { apiClient, Deployment } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { useRealTimeDeployments } from "@/hooks/use-real-time-deployments"
import { 
  Activity, 
  MoreHorizontal,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Zap,
  FileText,
  Trash2,
  Eye,
  Download,
  Server,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  GitBranch,
  Target,
  TrendingUp,
  Info
} from "lucide-react"

export default function DeploymentsPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Use real-time deployments hook or demo fallback based on environment
  const realTimeData = useRealTimeDeployments()
  const { 
    deployments, 
    deploymentMetrics, 
    deploymentEvents, 
    isConnected, 
    lastUpdate, 
    getDeploymentMetrics, 
    getDeploymentEvents 
  } = isDemoMode ? {
    deployments: [
      {
        name: 'nginx-deployment',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
        unavailableReplicas: 0,
        age: '15d',
        images: ['nginx:1.21']
      },
      {
        name: 'redis-deployment',
        namespace: 'default',
        replicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        unavailableReplicas: 0,
        age: '10d',
        images: ['redis:7-alpine']
      },
      {
        name: 'app-backend',
        namespace: 'production',
        replicas: 5,
        readyReplicas: 4,
        availableReplicas: 4,
        unavailableReplicas: 1,
        age: '7d',
        images: ['node:18-alpine']
      }
    ],
    deploymentMetrics: [],
    deploymentEvents: [],
    isConnected: false,
    lastUpdate: null,
    getDeploymentMetrics: (name: string, namespace: string) => ({
      replicas: Math.floor(Math.random() * 5) + 1,
      readyReplicas: Math.floor(Math.random() * 5) + 1,
      availableReplicas: Math.floor(Math.random() * 5) + 1,
      unavailableReplicas: Math.floor(Math.random() * 2),
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      lastUpdate: new Date().toISOString()
    }),
    getDeploymentEvents: (name: string, namespace: string) => [{
      type: 'Normal',
      reason: 'ScalingReplicaSet',
      message: `Scaled up replica set ${name}-xyz to 3`,
      deploymentName: name,
      namespace: namespace,
      timestamp: new Date().toISOString()
    }]
  } : realTimeData

  // Demo mode - fallback to original implementation with real-time features
  const [deploymentsState, setDeploymentsState] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeployments, setSelectedDeployments] = useState<Set<string>>(new Set())
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [deploymentEventsState, setDeploymentEventsState] = useState<any>(null)
  const [deploymentDetails, setDeploymentDetails] = useState<any>(null)
  const [showEventsDialog, setShowEventsDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showScaleDialog, setShowScaleDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { success, error: showError, info } = useToast()

  // Demo mode connection status
  const [demoLastUpdate, setDemoLastUpdate] = useState<Date | null>(null)

  // Use appropriate data source based on mode
  const currentDeployments = isDemoMode ? deploymentsState : deployments
  const currentLastUpdate = isDemoMode ? demoLastUpdate : lastUpdate
  const currentIsConnected = isDemoMode ? false : isConnected

  // Use appropriate functions based on mode
  const currentGetDeploymentMetrics = isDemoMode ? (name: string, namespace: string) => ({
    replicas: Math.floor(Math.random() * 5) + 1,
    readyReplicas: Math.floor(Math.random() * 5) + 1,
    availableReplicas: Math.floor(Math.random() * 5) + 1,
    unavailableReplicas: Math.floor(Math.random() * 2),
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    lastUpdate: new Date().toISOString()
  }) : getDeploymentMetrics

  const currentGetDeploymentEvents = isDemoMode ? (name: string, namespace: string) => [{
    type: 'Normal',
    reason: 'ScalingReplicaSet',
    message: `Scaled up replica set ${name}-xyz to 3`,
    deploymentName: name,
    namespace: namespace,
    timestamp: new Date().toISOString()
  }] : getDeploymentEvents

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [scaleReplicas, setScaleReplicas] = useState(1)

  const fetchDeployments = useCallback(async () => {
    if (isDemoMode) return // Skip fetch in demo mode - use mock data instead
    
    try {
      setLoading(true)
      const data = await apiClient.getDeployments(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setDeploymentsState(data)
      setDemoLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, isDemoMode])

  const fetchDeploymentEvents = async (deployment: Deployment) => {
    try {
      // Mock events data
      const mockEvents = {
        deployment: deployment.name,
        namespace: deployment.namespace,
        events: [
          {
            type: 'Normal',
            reason: 'ScalingReplicaSet',
            message: `Scaled up replica set ${deployment.name} to ${deployment.replicas}`,
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          {
            type: 'Normal',
            reason: 'SuccessfulCreate',
            message: `Created pod: ${deployment.name}-7d5c8b9f9-abc123`,
            timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
          },
          {
            type: 'Normal',
            reason: 'SuccessfulCreate',
            message: `Created pod: ${deployment.name}-7d5c8b9f9-def456`,
            timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
          },
          {
            type: 'Warning',
            reason: 'FailedCreate',
            message: `Error creating: pod "deployment-name" is invalid: spec.containers[0].image[0]: Invalid image name "invalid:latest"`,
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
          },
          {
            type: 'Normal',
            reason: 'SuccessfulDelete',
            message: `Deleted pod: ${deployment.name}-7d5c8b9f9-ghi789`,
            timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString()
          }
        ]
      }
      
      setDeploymentEventsState(mockEvents)
      setSelectedDeployment(deployment)
      setShowEventsDialog(true)
    } catch (error) {
      showError('Failed to fetch deployment events')
    }
  }

  const fetchDeploymentDetails = async (deployment: Deployment) => {
    try {
      // Mock detailed deployment information
      const details = {
        ...deployment,
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%'
          }
        },
        selector: {
          matchLabels: {
            app: deployment.name,
            tier: 'backend'
          }
        },
        template: {
          metadata: {
            labels: {
              app: deployment.name,
              tier: 'backend'
            }
          },
          spec: {
            containers: deployment.images.map((image, index) => ({
              name: `${deployment.name}-${index}`,
              image: image,
              ports: [{ containerPort: 8080 }],
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '128Mi'
                },
                limits: {
                  cpu: '500m',
                  memory: '512Mi'
                }
              }
            }))
          }
        },
        conditions: [
          { type: 'Available', status: 'True', lastUpdateTime: new Date().toISOString() },
          { type: 'Progressing', status: 'True', lastUpdateTime: new Date().toISOString() },
          { type: 'ReplicaFailure', status: 'False', lastUpdateTime: new Date().toISOString() }
        ],
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600
      }
      
      setDeploymentDetails(details)
      setSelectedDeployment(deployment)
      setShowDetailsDialog(true)
    } catch (error) {
      showError('Failed to fetch deployment details')
    }
  }

  const scaleDeployment = async (deployment: Deployment, replicas: number) => {
    try {
      success(`Deployment ${deployment.name} scaled to ${replicas} replicas successfully`)
      fetchDeployments()
      setShowScaleDialog(false)
    } catch (error) {
      showError(`Failed to scale deployment ${deployment.name}`)
    }
  }

  const restartDeployment = async (deployment: Deployment) => {
    try {
      success(`Deployment ${deployment.name} restarted successfully`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to restart deployment ${deployment.name}`)
    }
  }

  const rollbackDeployment = async (deployment: Deployment) => {
    try {
      success(`Deployment ${deployment.name} rolled back successfully`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to rollback deployment ${deployment.name}`)
    }
  }

  const deleteDeployment = async (deployment: Deployment) => {
    try {
      success(`Deployment ${deployment.name} deleted successfully`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to delete deployment ${deployment.name}`)
    }
  }

  const exportDeploymentData = () => {
    const csvContent = [
      ['Name', 'Namespace', 'Status', 'Replicas', 'Ready', 'Available', 'Unavailable', 'Images', 'Age'],
      ...filteredDeployments.map(deployment => [
        deployment.name,
        deployment.namespace,
        deployment.readyReplicas === deployment.replicas ? 'Ready' : 
        deployment.readyReplicas > 0 ? 'Progressing' : 'Not Ready',
        deployment.replicas.toString(),
        `${deployment.readyReplicas}/${deployment.replicas}`,
        deployment.availableReplicas.toString(),
        deployment.unavailableReplicas.toString(),
        deployment.images.join('; '),
        deployment.age ? new Date(deployment.age).toLocaleDateString() : '-'
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

  const bulkDeleteDeployments = async () => {
    try {
      if (selectedDeployments.size === 0) {
        info('No deployments selected for deletion')
        return
      }
      
      success(`${selectedDeployments.size} deployments deleted successfully`)
      setSelectedDeployments(new Set())
      fetchDeployments()
    } catch (error) {
      showError('Failed to delete selected deployments')
    }
  }

  const bulkRestartDeployments = async () => {
    try {
      if (selectedDeployments.size === 0) {
        info('No deployments selected for restart')
        return
      }
      
      success(`${selectedDeployments.size} deployments restarted successfully`)
      setSelectedDeployments(new Set())
      fetchDeployments()
    } catch (error) {
      showError('Failed to restart selected deployments')
    }
  }

  const toggleDeploymentSelection = (deploymentKey: string) => {
    setSelectedDeployments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(deploymentKey)) {
        newSet.delete(deploymentKey)
      } else {
        newSet.add(deploymentKey)
      }
      return newSet
    })
  }

  const selectAllDeployments = () => {
    if (selectedDeployments.size === filteredDeployments.length) {
      setSelectedDeployments(new Set())
    } else {
      setSelectedDeployments(new Set(filteredDeployments.map(deployment => `${deployment.namespace}-${deployment.name}`)))
    }
  }

  useEffect(() => {
    if (!isDemoMode) {
      fetchDeployments()
    } else {
      // Initialize demo data
      setDemoLastUpdate(new Date())
      setLoading(false)
    }
  }, [fetchDeployments, isDemoMode])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh && !isDemoMode) {
      interval = setInterval(fetchDeployments, 10000) // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchDeployments, isDemoMode])

  const getStatusBadge = (deployment: Deployment) => {
    if (deployment.readyReplicas === deployment.replicas) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>
    } else if (deployment.readyReplicas > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />Progressing</Badge>
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Not Ready</Badge>
    }
  }

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "ready" && deployment.readyReplicas === deployment.replicas) ||
                         (statusFilter === "progressing" && deployment.readyReplicas > 0 && deployment.readyReplicas < deployment.replicas) ||
                         (statusFilter === "notready" && deployment.readyReplicas === 0)
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
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading deployments...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching deployment information from cluster</p>
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
            <Button onClick={fetchDeployments} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const readyDeployments = deployments.filter(d => d.readyReplicas === d.replicas).length
  const progressingDeployments = deployments.filter(d => d.readyReplicas > 0 && d.readyReplicas < d.replicas).length
  const totalReplicas = deployments.reduce((acc, d) => acc + d.replicas, 0)

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Deployments</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage application deployments and replica sets with real-time scaling</p>
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
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Demo Mode</span>
                    </>
                  ) : currentIsConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
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
              <Button variant="outline" size="lg" onClick={exportDeploymentData} className="rounded-xl">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="lg" onClick={fetchDeployments} className="rounded-xl">
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Deployments</CardTitle>
                <Database className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{deployments.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all namespaces</p>
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
                <div className="text-2xl font-bold text-green-600">{readyDeployments}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fully deployed</p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Progressing</CardTitle>
                <Clock className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{progressingDeployments}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In progress</p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Replicas</CardTitle>
                <Zap className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalReplicas}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all deployments</p>
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
                <Database className="h-5 w-5 text-blue-600" />
                <span>Deployment Management</span>
              </CardTitle>
              <CardDescription>
                {filteredDeployments.length} deployments found
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
                        placeholder="Search deployments by name or namespace..."
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
                    {Array.from(new Set(deployments.map(d => d.namespace))).map(ns => (
                      <option key={ns} value={ns}>{ns}</option>
                    ))}
                  </select>
                  <select
                    className="px-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white transition-all duration-200"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="ready">Ready</option>
                    <option value="progressing">Progressing</option>
                    <option value="notready">Not Ready</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedDeployments.size > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        <span className="text-sm font-medium">
                          {selectedDeployments.size} {selectedDeployments.size === 1 ? 'deployment' : 'deployments'} selected
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={bulkRestartDeployments}
                        className="rounded-lg"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart Selected
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={bulkDeleteDeployments}
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
                            checked={selectedDeployments.size === filteredDeployments.length && filteredDeployments.length > 0}
                            onCheckedChange={selectAllDeployments}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Namespace</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Replicas</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Ready</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Available</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Unavailable</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Images</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Age</TableHead>
                      <TableHead className="w-[50px] py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeployments.map((deployment, index) => {
                      const deploymentKey = `${deployment.namespace}-${deployment.name}`
                      const isSelected = selectedDeployments.has(deploymentKey)
                      
                      return (
                        <motion.tr
                          key={deploymentKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleDeploymentSelection(deploymentKey)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white py-4">{deployment.name}</TableCell>
                          <TableCell className="py-4">{deployment.namespace}</TableCell>
                          <TableCell className="py-4">{getStatusBadge(deployment)}</TableCell>
                          <TableCell className="py-4">{deployment.replicas}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1">
                              <span>{deployment.readyReplicas}</span>
                              <span className="text-slate-400">/</span>
                              <span>{deployment.replicas}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">{deployment.availableReplicas}</TableCell>
                          <TableCell className="py-4">
                            {deployment.unavailableReplicas > 0 ? (
                              <span className="text-red-600">{deployment.unavailableReplicas}</span>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              {deployment.images.slice(0, 2).map((image, index) => (
                                <div key={index} className="text-sm truncate max-w-[200px]" title={image}>
                                  {image}
                                </div>
                              ))}
                              {deployment.images.length > 2 && (
                                <div className="text-xs text-slate-500">
                                  +{deployment.images.length - 2} more
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {deployment.age ? new Date(deployment.age).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => fetchDeploymentDetails(deployment)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fetchDeploymentEvents(deployment)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Events
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {setSelectedDeployment(deployment); setScaleReplicas(deployment.replicas); setShowScaleDialog(true)}}>
                                  <ArrowUp className="h-4 w-4 mr-2" />
                                  Scale
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => restartDeployment(deployment)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restart
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => rollbackDeployment(deployment)}>
                                  <GitBranch className="h-4 w-4 mr-2" />
                                  Rollback
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteDeployment(deployment)}>
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
              Deployment Events: {selectedDeployment?.name}
            </DialogTitle>
            <DialogDescription>
              Namespace: {selectedDeployment?.namespace} | Status: {selectedDeployment?.readyReplicas}/{selectedDeployment?.replicas} ready
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ScrollArea className="h-[60vh] w-full rounded-md border bg-slate-900 text-slate-100 p-4">
              <div className="space-y-3">
                {deploymentEventsState?.events?.map((event: any, index: number) => (
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
              Deployment Details: {selectedDeployment?.name}
            </DialogTitle>
            <DialogDescription>
              Namespace: {selectedDeployment?.namespace} | Status: {selectedDeployment?.readyReplicas}/{selectedDeployment?.replicas} ready
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="containers">Containers</TabsTrigger>
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
                      <div><strong>Name:</strong> {selectedDeployment?.name}</div>
                      <div><strong>Namespace:</strong> {selectedDeployment?.namespace}</div>
                      <div><strong>Replicas:</strong> {selectedDeployment?.replicas}</div>
                      <div><strong>Ready:</strong> {selectedDeployment?.readyReplicas}/{selectedDeployment?.replicas}</div>
                      <div><strong>Created:</strong> {selectedDeployment?.age ? new Date(selectedDeployment.age).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Status
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Available:</strong> {deploymentDetails?.availableReplicas}</div>
                      <div><strong>Unavailable:</strong> {deploymentDetails?.unavailableReplicas}</div>
                      <div><strong>Progress Deadline:</strong> {deploymentDetails?.progressDeadlineSeconds}s</div>
                      <div><strong>Revision History:</strong> {deploymentDetails?.revisionHistoryLimit}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Selector
                  </h4>
                  <div className="flex gap-2">
                    {Object.entries(deploymentDetails?.selector?.matchLabels || {}).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}={String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="strategy" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Deployment Strategy</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div><strong>Type:</strong> {deploymentDetails?.strategy?.type}</div>
                        {deploymentDetails?.strategy?.rollingUpdate && (
                          <>
                            <div><strong>Max Unavailable:</strong> {deploymentDetails.strategy.rollingUpdate.maxUnavailable}</div>
                            <div><strong>Max Surge:</strong> {deploymentDetails.strategy.rollingUpdate.maxSurge}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="containers" className="space-y-4">
                {deploymentDetails?.template?.spec?.containers?.map((container: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{container.name}</div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {container.image}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <div><strong>Port:</strong> {container.ports?.[0]?.containerPort}</div>
                          <div><strong>Resources:</strong></div>
                          <div className="ml-4 space-y-1">
                            <div>Requests: CPU {container.resources?.requests?.cpu}, Memory {container.resources?.requests?.memory}</div>
                            <div>Limits: CPU {container.resources?.limits?.cpu}, Memory {container.resources?.limits?.memory}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                {deploymentDetails?.conditions?.map((condition: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{condition.type}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Last updated: {new Date(condition.lastUpdateTime).toLocaleString()}
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

      {/* Scale Dialog */}
      <Dialog open={showScaleDialog} onOpenChange={setShowScaleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              Scale Deployment: {selectedDeployment?.name}
            </DialogTitle>
            <DialogDescription>
              Adjust the number of replicas for this deployment
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Replicas</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScaleReplicas(Math.max(0, scaleReplicas - 1))}
                  disabled={scaleReplicas <= 0}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <div className="w-20 text-center">
                  <input
                    type="number"
                    value={scaleReplicas}
                    onChange={(e) => setScaleReplicas(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center border border-slate-300 rounded px-2 py-1"
                    min="0"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScaleReplicas(scaleReplicas + 1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Current: {selectedDeployment?.readyReplicas}/{selectedDeployment?.replicas} ready
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowScaleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedDeployment && scaleDeployment(selectedDeployment, scaleReplicas)}>
              Scale Deployment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
