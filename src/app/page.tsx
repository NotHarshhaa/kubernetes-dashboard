"use client"

import { useState, useEffect } from "react"
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
        return <Badge variant="default" className="text-xs gap-1"><CheckCircle className="w-3 h-3" />{status}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs gap-1"><Clock className="w-3 h-3" />{status}</Badge>
      case 'failed':
      case 'notready':
        return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />{status}</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const MetricCard = ({ title, value, subtitle, icon, trend }: {
    title: string
    value: string | number
    subtitle: string
    icon: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
  }) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
          <div className="p-2 rounded-lg bg-muted text-foreground">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <span>{subtitle}</span>
            {trend && (
              <span className={`ml-2 flex items-center ${trend === 'up' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {trend === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Cluster Overview
                </h1>
                {isDemoMode && (
                  <Badge variant="outline" className="text-xs">
                    Demo Environment
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time metrics, health diagnostics, and cluster operational state
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <Activity className="h-3.5 w-3.5 mr-2" />
                Refresh State
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Nodes"
              value={clusterInfo?.nodes || 0}
              subtitle="Active cluster nodes"
              icon={<Server className="h-4 w-4" />}
              trend="up"
            />
            <MetricCard
              title="Pods"
              value={clusterInfo?.pods || pods.length}
              subtitle={`${pods.filter(p => p.status === 'Running').length} healthy running`}
              icon={<Container className="h-4 w-4" />}
              trend="up"
            />
            <MetricCard
              title="Services"
              value={clusterInfo?.services || services.length}
              subtitle="Cluster endpoints"
              icon={<Network className="h-4 w-4" />}
              trend="neutral"
            />
            <MetricCard
              title="Namespaces"
              value={clusterInfo?.namespaces || 4}
              subtitle="Isolation partitions"
              icon={<Database className="h-4 w-4" />}
              trend="neutral"
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Charts */}
          <ResourceCharts />

          {/* Recent Resources & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Pods</CardTitle>
                    <CardDescription>Latest container runtime activity</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="text-xs">
                    <a href="/pods">View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pods.slice(0, 5).map((pod) => (
                    <div
                      key={`${pod.namespace}-${pod.name}`}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-muted text-foreground">
                          <Container className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{pod.name}</p>
                          <p className="text-xs text-muted-foreground">{pod.namespace} • Node: {pod.node}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(pod.status)}
                        <span className="text-xs font-mono text-muted-foreground hidden sm:inline">{pod.ip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ActivityFeed />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
