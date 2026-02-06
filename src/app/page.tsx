"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { ActivityFeed } from "@/components/activity-feed"
import { ResourceCharts } from "@/components/resource-charts"
import { QuickActions } from "@/components/quick-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient, ClusterInfo, Pod, Node, Service } from "@/lib/api-client"
import { 
  Activity, 
  Container, 
  Database, 
  Server,
  Shield,
  Eye,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowDownRight,
  Network
} from "lucide-react"

export default function Home() {
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null)
  const [pods, setPods] = useState<Pod[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [info, podsData, nodesData, servicesData] = await Promise.all([
          apiClient.getClusterInfo(),
          apiClient.getPods(),
          apiClient.getNodes(),
          apiClient.getServices()
        ])
        
        setClusterInfo(info)
        setPods(podsData)
        setNodes(nodesData)
        setServices(servicesData)
        
        // Check if we're using demo data by checking if cluster name is 'demo-cluster'
        setIsDemoMode(info.name === 'demo-cluster')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cluster data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
      case 'failed':
      case 'notready':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const MetricCard = ({ title, value, subtitle, icon, trend, color }: {
    title: string
    value: string | number
    subtitle: string
    icon: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
    color?: 'blue' | 'green' | 'purple' | 'orange'
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color || 'blue']} opacity-5`}></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">{title}</CardTitle>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 shadow-inner">
              {icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-3">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
              {trend && (
                <div className={`flex items-center text-sm ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">{subtitle}</p>
          </CardContent>
        </Card>
      </motion.div>
    )
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
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading cluster data...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connecting to your Kubernetes cluster</p>
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
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const readyNodes = nodes.filter(n => n.status === 'Ready').length
  const runningPods = pods.filter(p => p.status === 'Running').length
  const internalServices = services.filter(s => s.type === 'ClusterIP').length

  return (
    <ProtectedRoute>
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Cluster Overview</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Monitor and manage your Kubernetes cluster with real-time insights</p>
            </div>
            <div className="flex items-center space-x-4">
              {isDemoMode && (
                <Badge variant="outline" className="border-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-2">
                  <Eye className="w-4 h-4 mr-2" />
                  Demo Mode
                </Badge>
              )}
              <Badge variant="outline" className="border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
                Connected
              </Badge>
              <Button variant="outline" size="lg" onClick={() => window.location.reload()} className="rounded-xl">
                <Activity className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Nodes"
            value={clusterInfo?.nodes || 0}
            subtitle={`${readyNodes} ready, ${nodes.length - readyNodes} not ready`}
            icon={<Server className="h-6 w-6 text-blue-600" />}
            trend="neutral"
            color="blue"
          />
          <MetricCard
            title="Pods"
            value={clusterInfo?.pods || 0}
            subtitle={`${runningPods} running, ${pods.length - runningPods} other states`}
            icon={<Container className="h-6 w-6 text-green-600" />}
            trend="up"
            color="green"
          />
          <MetricCard
            title="Services"
            value={clusterInfo?.services || 0}
            subtitle={`${internalServices} internal, ${services.length - internalServices} external`}
            icon={<Network className="h-6 w-6 text-purple-600" />}
            trend="neutral"
            color="purple"
          />
          <MetricCard
            title="Namespaces"
            value={clusterInfo?.namespaces || 0}
            subtitle="Active namespaces"
            icon={<Database className="h-6 w-6 text-orange-600" />}
            trend="neutral"
            color="orange"
          />
        </div>

        {/* Cluster Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Cluster Information</span>
              </CardTitle>
              <CardDescription className="text-base">
                Kubernetes {clusterInfo?.version} • Production Environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cluster Name</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{clusterInfo?.name}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kubernetes Version</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{clusterInfo?.version}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Connection Status</p>
                  <div className="mt-2">
                    {getStatusBadge('Connected')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Container className="h-5 w-5 text-green-600" />
                  <span>Recent Pods</span>
                </CardTitle>
                <CardDescription>
                  Latest pod activity in the cluster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pods.slice(0, 5).map((pod, index) => (
                    <motion.div
                      key={pod.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{pod.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{pod.namespace}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          {getStatusBadge(pod.status)}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pod.ready}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  <span>Node Status</span>
                </CardTitle>
                <CardDescription>
                  Health and status of cluster nodes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nodes.slice(0, 5).map((node, index) => (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{node.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{node.roles.join(', ')}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          {getStatusBadge(node.status)}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{node.version}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Features Section */}
          <div className="space-y-6">
            <ActivityFeed />
            <QuickActions />
          </div>

          {/* Resource Charts Section */}
          <ResourceCharts />
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
