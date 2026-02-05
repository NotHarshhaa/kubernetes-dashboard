"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, Pod, Node } from "@/lib/api-client"
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
  Server
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface MetricData {
  time: string
  value: number
  label: string
}

export default function MonitoringPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [podsData, nodesData] = await Promise.all([
        apiClient.getPods(),
        apiClient.getNodes()
      ])
      
      setPods(podsData)
      setNodes(nodesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockMetrics = (type: string): MetricData[] => {
    const now = new Date()
    const data: MetricData[] = []
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      let value = 0
      
      switch (type) {
        case 'cpu':
          value = Math.random() * 100
          break
        case 'memory':
          value = Math.random() * 100
          break
        case 'network':
          value = Math.random() * 1000
          break
        case 'pods':
          value = Math.floor(Math.random() * 50) + 10
          break
        default:
          value = Math.random() * 100
      }
      
      data.push({
        time: time.getHours() + ':00',
        value: Math.round(value * 100) / 100,
        label: type
      })
    }
    
    return data
  }

  const cpuMetrics = generateMockMetrics('cpu')
  const memoryMetrics = generateMockMetrics('memory')
  const networkMetrics = generateMockMetrics('network')
  const podsMetrics = generateMockMetrics('pods')

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Monitoring</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time cluster metrics and performance monitoring</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">CPU Usage</CardTitle>
                <Cpu className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {cpuMetrics[cpuMetrics.length - 1]?.value.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +2.3% from last hour
                </p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Memory Usage</CardTitle>
                <MemoryStick className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {memoryMetrics[memoryMetrics.length - 1]?.value.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                  -1.2% from last hour
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
                    Cluster-wide CPU utilization percentage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cpuMetrics}>
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
                    Cluster-wide memory utilization percentage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={memoryMetrics}>
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
                    <span>Network Traffic</span>
                  </CardTitle>
                  <CardDescription>
                    Network I/O in MB/s
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={networkMetrics}>
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
                    <span>Pod Count</span>
                  </CardTitle>
                  <CardDescription>
                    Number of running pods over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={podsMetrics}>
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
    </DashboardLayout>
  )
}
