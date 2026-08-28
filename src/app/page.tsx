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
  CheckCircle2,
  Clock,
  AlertTriangle,
  Network,
  RefreshCw,
  TrendingUp,
  Layers,
  Zap
} from "lucide-react"

export default function Home() {
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null)
  const [pods, setPods] = useState<Pod[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

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

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'ready':
        return (
          <Badge variant="success" className="text-xs gap-1 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {status}
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning" className="text-xs gap-1 py-0.5">
            <Clock className="size-3" />
            {status}
          </Badge>
        )
      case 'failed':
      case 'notready':
        return (
          <Badge variant="destructive" className="text-xs gap-1 py-0.5">
            <AlertTriangle className="size-3" />
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const runningPodsCount = pods.filter(p => p.status === 'Running').length
  const readyNodesCount = nodes.filter(n => n.status === 'Ready').length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-muted/30 shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Shield className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      Cluster Overview
                    </h1>
                    {isDemoMode && (
                      <Badge variant="secondary" className="text-[11px] font-semibold">
                        Demo Environment
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kubernetes v1.28.2 • 4 active nodes • {runningPodsCount}/{pods.length || 8} healthy pods running
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                className="shadow-xs"
              >
                <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh State
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="hover:border-primary/40 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compute Nodes
                </CardTitle>
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <Server className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {clusterInfo?.nodes || nodes.length || 4}
                  </div>
                  <Badge variant="success" className="text-[10px] h-4.5 px-1.5 font-semibold">
                    {readyNodesCount || 3} Schedulable
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>32 Core compute pool</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Container Pods
                </CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Container className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {clusterInfo?.pods || pods.length}
                  </div>
                  <Badge variant="success" className="text-[10px] h-4.5 px-1.5 font-semibold">
                    {runningPodsCount} Running
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>Across all namespace zones</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Network Services
                </CardTitle>
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                  <Network className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {clusterInfo?.services || services.length || 5}
                  </div>
                  <Badge variant="purple" className="text-[10px] h-4.5 px-1.5 font-semibold">
                    Ingress Ready
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>ClusterIP & LoadBalancers</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Namespaces
                </CardTitle>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Layers className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {clusterInfo?.namespaces || 4}
                  </div>
                  <Badge variant="warning" className="text-[10px] h-4.5 px-1.5 font-semibold">
                    Isolated
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>RBAC boundary partitions</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Resource Telemetry Charts */}
          <ResourceCharts />

          {/* Recent Resources & Activity Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Container className="size-4 text-primary" />
                    Active Pods
                  </CardTitle>
                  <CardDescription>Latest container runtime status and host nodes</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <a href="/pods">View All <ArrowUpRight className="size-3.5 ml-1" /></a>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {pods.slice(0, 5).map((pod, idx) => (
                    <div
                      key={`${pod.namespace}-${pod.name}-${pod.node || idx}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/40 transition-all duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted text-foreground border border-border/50">
                          <Container className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-foreground font-mono">{pod.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-mono">
                              {pod.namespace}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">Node: {pod.node}</span>
                          </div>
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
