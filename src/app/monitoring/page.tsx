"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient, Pod, Node } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { useRealTimeMetrics } from "@/hooks/use-real-time-metrics"
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  Server,
  Download,
  Settings,
  Bell,
  Filter,
  Calendar,
  Clock,
  Eye,
  FileText,
  Shield,
  Network,
  Monitor,
  TriangleAlert,
  Info,
  X,
  Wifi,
  WifiOff
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'

interface MetricData {
  time: string
  value: number
  label: string
}

interface MockMetrics {
  cpu: MetricData[]
  memory: MetricData[]
  network: MetricData[]
  pods: MetricData[]
  nodes: MetricData[]
}

export default function MonitoringPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Use real-time metrics hook or demo fallback based on environment
  const realTimeData = useRealTimeMetrics()
  const { 
    metrics: realTimeMetrics, 
    events: realTimeEvents, 
    alerts: realTimeAlerts, 
    isConnected: realTimeIsConnected, 
    lastUpdate: realTimeLastUpdate, 
    dismissAlert: realTimeDismissAlert, 
    dismissAllAlerts: realTimeDismissAllAlerts, 
    getLatestMetric: realTimeGetLatestMetric, 
    getMetricTrend: realTimeGetMetricTrend 
  } = isDemoMode ? {
    metrics: { cpu: [], memory: [], network: [], pods: [], nodes: [] },
    events: [],
    alerts: [],
    isConnected: false,
    lastUpdate: null,
    dismissAlert: () => {},
    dismissAllAlerts: () => {},
    getLatestMetric: () => null,
    getMetricTrend: () => 'stable'
  } : realTimeData

  const [pods, setPods] = useState<Pod[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [showAlertsDialog, setShowAlertsDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<any>(null)
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())
  const [notifications, setNotifications] = useState<boolean>(true)
  const [refreshInterval, setRefreshInterval] = useState<number>(10)
  
  interface Alert {
    id: string
    type: 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: string
    details?: string[]
  }

  // Demo mode - use mock data
  const [demoMetrics, setDemoMetrics] = useState<MockMetrics>({
    cpu: [],
    memory: [],
    network: [],
    pods: [],
    nodes: []
  })
  const [demoEvents, setDemoEvents] = useState([])
  const [demoAlerts, setDemoAlerts] = useState<Alert[]>([])
  const [demoLastUpdate, setDemoLastUpdate] = useState<Date | null>(null)
  
  // Use appropriate data source based on mode
  const currentMetrics = isDemoMode ? demoMetrics : realTimeMetrics
  const currentEvents = isDemoMode ? demoEvents : realTimeEvents
  const currentAlerts = isDemoMode ? demoAlerts : realTimeAlerts
  const currentIsConnected = isDemoMode ? false : realTimeIsConnected
  const currentLastUpdate = isDemoMode ? demoLastUpdate : realTimeLastUpdate
  
  // Use appropriate functions based on mode
  const currentGetLatestMetric = isDemoMode ? (type: keyof MockMetrics) => {
    const metricData = demoMetrics[type]
    return metricData.length > 0 ? metricData[metricData.length - 1] : null
  } : realTimeGetLatestMetric
  
  const currentGetMetricTrend = isDemoMode ? (type: keyof MockMetrics) => 'stable' : realTimeGetMetricTrend
  
  const currentDismissAlert = isDemoMode ? (alertId: string) => {
    setDemoAlerts(prev => prev.filter((alert: any) => alert.id !== alertId))
  } : realTimeDismissAlert
  
  const currentDismissAllAlerts = isDemoMode ? () => {
    setDemoAlerts([])
  } : realTimeDismissAllAlerts
  
  const { success, error: showError, info } = useToast()

  const fetchData = useCallback(async () => {
    if (!isDemoMode) return // Skip fetch in real-time mode
    
    try {
      setLoading(true)
      const [podsData, nodesData] = await Promise.all([
        apiClient.getPods(),
        apiClient.getNodes()
      ])
      
      setPods(podsData)
      setNodes(nodesData)
      setDemoLastUpdate(new Date())
      
      // Generate mock metrics
      const mockMetrics = generateMockMetrics()
      setDemoMetrics(mockMetrics)
      
      // Generate mock currentAlerts
      const mockAlerts = generateMockAlerts(podsData, nodesData)
      setDemoAlerts(mockAlerts)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  const generateMockMetrics = () => {
    const now = new Date()
    const mockMetrics: MockMetrics = {
      cpu: [],
      memory: [],
      network: [],
      pods: [],
      nodes: []
    }
    
    // Generate 24 data points for each metric
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      const timeStr = time.getHours() + ':00'
      
      mockMetrics.cpu.push({
        time: timeStr,
        value: Math.random() * 100,
        label: 'cpu'
      })
      
      mockMetrics.memory.push({
        time: timeStr,
        value: Math.random() * 100,
        label: 'memory'
      })
      
      mockMetrics.network.push({
        time: timeStr,
        value: Math.random() * 1000,
        label: 'network'
      })
      
      mockMetrics.pods.push({
        time: timeStr,
        value: Math.floor(Math.random() * 50) + 10,
        label: 'pods'
      })
      
      mockMetrics.nodes.push({
        time: timeStr,
        value: Math.floor(Math.random() * 10) + 1,
        label: 'nodes'
      })
    }
    
    return mockMetrics
  }

  const generateMockAlerts = (podsData: Pod[], nodesData: Node[]) => {
    const newAlerts: Alert[] = []
    
    // Check for unhealthy nodes
    const unhealthyNodes = nodesData.filter(n => n.status !== 'Ready')
    if (unhealthyNodes.length > 0) {
      newAlerts.push({
        id: 'nodes-unhealthy',
        type: 'error',
        title: 'Unhealthy Nodes Detected',
        message: `${unhealthyNodes.length} nodes are not ready`,
        timestamp: new Date().toISOString(),
        details: unhealthyNodes.map(n => n.name)
      })
    }
    
    // Check for failed pods
    const failedPods = podsData.filter(p => p.status !== 'Running')
    if (failedPods.length > 5) {
      newAlerts.push({
        id: 'pods-failed',
        type: 'warning',
        title: 'High Pod Failure Rate',
        message: `${failedPods.length} pods are not running`,
        timestamp: new Date().toISOString(),
        details: failedPods.slice(0, 5).map(p => p.name)
      })
    }
    
    // Add a random CPU alert for demo
    if (Math.random() > 0.7) {
      newAlerts.push({
        id: 'cpu-pressure',
        type: 'warning',
        title: 'High CPU Usage',
        message: `Average CPU usage is ${(Math.random() * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      })
    }
    
    return newAlerts
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(fetchData, refreshInterval * 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchData])

  const exportMonitoringData = () => {
    const csvContent = [
      ['Metric', 'Current Value', 'Status', 'Timestamp'],
      ['CPU Usage', `${currentGetLatestMetric('cpu')?.value.toFixed(1) || 0}%`, 'Normal', new Date().toISOString()],
      ['Memory Usage', `${currentGetLatestMetric('memory')?.value.toFixed(1) || 0}%`, 'Normal', new Date().toISOString()],
      ['Network Traffic', `${currentGetLatestMetric('network')?.value.toFixed(1) || 0} MB/s`, 'Normal', new Date().toISOString()],
      ['Running Pods', `${currentGetLatestMetric('pods')?.value || 0}`, 'Running', new Date().toISOString()],
      ['Healthy Nodes', `${currentGetLatestMetric('nodes')?.value || 0}`, 'Healthy', new Date().toISOString()]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitoring-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    success('Monitoring data exported successfully')
  }

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) {
        newSet.delete(alertId)
      } else {
        newSet.add(alertId)
      }
      return newSet
    })
  }

  const dismissSelectedAlerts = () => {
    if (selectedAlerts.size === 0) {
      info('No currentAlerts selected for dismissal')
      return
    }
    
    selectedAlerts.forEach(alertId => currentDismissAlert(alertId))
    setSelectedAlerts(new Set())
    success(`${selectedAlerts.size} currentAlerts dismissed successfully`)
  }

  const viewMetricDetails = (metricType: keyof MockMetrics) => {
    const metricHistory = currentMetrics[metricType]
    const current = currentGetLatestMetric(metricType)
    const trend = currentGetMetricTrend(metricType)
    
    const metricData = {
      type: metricType,
      current: current?.value || 0,
      history: metricHistory,
      trend: trend,
      change: ((Math.random() * 10 - 5)).toFixed(1)
    }
    
    setSelectedMetric(metricData)
    setShowDetailsDialog(true)
  }

  const healthStatus = {
    healthy: nodes.filter(n => n.status === 'Ready').length,
    unhealthy: nodes.filter(n => n.status === 'NotReady').length,
    totalPods: pods.length,
    runningPods: pods.filter(p => p.status === 'Running').length
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400/20"></div>
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading monitoring data...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching cluster metrics</p>
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
            <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Monitoring</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Real-time cluster metrics and performance monitoring with live currentAlerts</p>
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
                {autoRefresh ? `Auto (${refreshInterval}s)` : 'Auto Refresh'}
              </Button>
              <Button variant="outline" size="lg" onClick={exportMonitoringData} className="rounded-xl">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShowSettingsDialog(true)} className="rounded-xl">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="lg" onClick={fetchData} className="rounded-xl">
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setShowAlertsDialog(true)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Alerts</CardTitle>
                <Bell className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{currentAlerts.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Active currentAlerts
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => viewMetricDetails('cpu')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Healthy Nodes</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{healthStatus.healthy}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {healthStatus.unhealthy} unhealthy
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => viewMetricDetails('pods')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Running Pods</CardTitle>
                <Activity className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{healthStatus.runningPods}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {healthStatus.totalPods - healthStatus.runningPods} not running
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => viewMetricDetails('cpu')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">CPU Usage</CardTitle>
                <Cpu className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {currentGetLatestMetric('cpu')?.value.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentGetMetricTrend('cpu') === 'up' ? (
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                  ) : currentGetMetricTrend('cpu') === 'down' ? (
                    <TrendingDown className="inline h-3 w-3 mr-1" />
                  ) : (
                    <Activity className="inline h-3 w-3 mr-1" />
                  )}
                  {currentGetMetricTrend('cpu') === 'up' ? '+' : ''}{(Math.random() * 10 - 5).toFixed(1)}% from last hour
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => viewMetricDetails('memory')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Memory Usage</CardTitle>
                <MemoryStick className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {currentGetLatestMetric('memory')?.value.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentGetMetricTrend('memory') === 'up' ? (
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                  ) : currentGetMetricTrend('memory') === 'down' ? (
                    <TrendingDown className="inline h-3 w-3 mr-1" />
                  ) : (
                    <Activity className="inline h-3 w-3 mr-1" />
                  )}
                  {currentGetMetricTrend('memory') === 'up' ? '+' : ''}{(Math.random() * 10 - 5).toFixed(1)}% from last hour
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="cpu" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cpu" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">CPU Usage</TabsTrigger>
              <TabsTrigger value="memory" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">Memory Usage</TabsTrigger>
              <TabsTrigger value="network" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">Network Traffic</TabsTrigger>
              <TabsTrigger value="pods" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">Pod Count</TabsTrigger>
            </TabsList>

            <TabsContent value="cpu">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5 text-orange-600" />
                    <span>CPU Usage Over Time</span>
                  </CardTitle>
                  <CardDescription>
                    Cluster-wide CPU utilization percentage - Real-time data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={currentMetrics.cpu}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memory">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MemoryStick className="h-5 w-5 text-purple-600" />
                    <span>Memory Usage Over Time</span>
                  </CardTitle>
                  <CardDescription>
                    Cluster-wide memory utilization percentage - Real-time data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={currentMetrics.memory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span>Network Traffic Over Time</span>
                  </CardTitle>
                  <CardDescription>
                    Cluster network I/O in MB/s - Real-time monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentMetrics.network}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pods">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Pod Count Over Time</span>
                  </CardTitle>
                  <CardDescription>
                    Total number of running pods in the cluster - Live tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={currentMetrics.pods}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Node Resource Usage */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-600" />
                <span>Node Resource Usage</span>
              </CardTitle>
              <CardDescription>
                Current resource utilization per node
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nodes.slice(0, 5).map((node, index) => (
                  <motion.div
                    key={node.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{node.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{node.roles.join(', ')}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Cpu className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">{Math.random() * 100}%</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">CPU</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <MemoryStick className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">{Math.random() * 100}%</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Memory</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{Math.random() * 100}%</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Storage</p>
                      </div>
                      <div>
                        {node.status === 'Ready' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />Ready
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />Not Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts Dialog */}
      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Alerts
            </DialogTitle>
            <DialogDescription>
              {currentAlerts.length} active currentAlerts in the cluster
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedAlerts.size === currentAlerts.length && currentAlerts.length > 0}
                  onCheckedChange={() => {
                    if (selectedAlerts.size === currentAlerts.length) {
                      setSelectedAlerts(new Set())
                    } else {
                      setSelectedAlerts(new Set(currentAlerts.map((a: any) => a.id)))
                    }
                  }}
                />
                <span className="text-sm">Select All</span>
              </div>
              {selectedAlerts.size > 0 && (
                <Button variant="outline" size="sm" onClick={dismissSelectedAlerts}>
                  Dismiss Selected ({selectedAlerts.size})
                </Button>
              )}
            </div>
            <ScrollArea className="h-[60vh] w-full rounded-md border">
              <div className="p-4 space-y-3">
                {currentAlerts.map((alert: any, index: number) => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${selectedAlerts.has(alert.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox 
                          checked={selectedAlerts.has(alert.id)}
                          onCheckedChange={() => toggleAlertSelection(alert.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                              {alert.type === 'error' ? 'Error' : 'Warning'}
                            </Badge>
                            <span className="font-medium text-slate-900">{alert.title}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                          {alert.details && (
                            <div className="text-xs text-slate-500">
                              <span className="font-medium">Details:</span> {alert.details.join(', ')}
                            </div>
                          )}
                          <div className="text-xs text-slate-400 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => currentDismissAlert(alert.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAlertsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Monitoring Settings
            </DialogTitle>
            <DialogDescription>
              Configure monitoring preferences
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Auto Refresh Interval</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Notifications</label>
              <Checkbox 
                checked={notifications}
                onCheckedChange={(checked) => setNotifications(checked as boolean)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              success('Settings saved successfully')
              setShowSettingsDialog(false)
            }}>
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Metric Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {selectedMetric?.type?.charAt(0).toUpperCase() + selectedMetric?.type?.slice(1)} Metrics Details
            </DialogTitle>
            <DialogDescription>
              Detailed metrics and historical data
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedMetric?.current?.toFixed(1)}
                    {selectedMetric?.type === 'cpu' || selectedMetric?.type === 'memory' ? '%' : 
                     selectedMetric?.type === 'network' ? ' MB/s' : ' pods'}
                  </div>
                  <p className="text-sm text-slate-600">Current Value</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {selectedMetric?.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-lg font-semibold ${selectedMetric?.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedMetric?.change}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Change from last period</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedMetric?.history?.length}
                  </div>
                  <p className="text-sm text-slate-600">Data Points</p>
                </CardContent>
              </Card>
            </div>
            <div className="h-[40vh]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedMetric?.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={selectedMetric?.type === 'cpu' ? '#f97316' : 
                           selectedMetric?.type === 'memory' ? '#a855f7' :
                           selectedMetric?.type === 'network' ? '#3b82f6' : '#10b981'}
                    fill={selectedMetric?.type === 'cpu' ? '#f97316' : 
                           selectedMetric?.type === 'memory' ? '#a855f7' :
                           selectedMetric?.type === 'network' ? '#3b82f6' : '#10b981'}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
