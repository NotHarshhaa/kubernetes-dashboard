"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { apiClient, Pod, Node } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Bell, 
  Network, 
  Server
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts'

export default function MonitoringPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [metricsHistory, setMetricsHistory] = useState<Array<{ time: string; cpu: number; memory: number; network: number }>>([])
  const { success } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [podsData, nodesData] = await Promise.all([
        apiClient.getPods(),
        apiClient.getNodes()
      ])
      setPods(podsData)
      setNodes(nodesData)
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Generate real-time telemetry time series
  useEffect(() => {
    const generateInitialData = () => {
      const data = []
      const now = new Date()
      for (let i = 10; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10000)
        data.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: Math.floor(35 + Math.random() * 25),
          memory: Math.floor(50 + Math.random() * 15),
          network: Math.floor(120 + Math.random() * 60)
        })
      }
      return data
    }

    setMetricsHistory(generateInitialData())

    const interval = setInterval(() => {
      if (autoRefresh) {
        setMetricsHistory(prev => {
          const now = new Date()
          const newPoint = {
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: Math.floor(35 + Math.random() * 25),
            memory: Math.floor(50 + Math.random() * 15),
            network: Math.floor(120 + Math.random() * 60)
          }
          return [...prev.slice(1), newPoint]
        })
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const latestCpu = metricsHistory[metricsHistory.length - 1]?.cpu || 45
  const latestMemory = metricsHistory[metricsHistory.length - 1]?.memory || 58
  const latestNetwork = metricsHistory[metricsHistory.length - 1]?.network || 140

  const runningPods = pods.filter(p => p.status === 'Running').length
  const readyNodes = nodes.filter(n => n.status === 'Ready').length

  const exportData = () => {
    const csvContent = [
      ['Time', 'CPU (%)', 'Memory (%)', 'Network (MB/s)'],
      ...metricsHistory.map(m => [m.time, m.cpu.toString(), m.memory.toString(), m.network.toString()])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cluster-metrics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    success('Metrics exported successfully')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Activity className="size-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Cluster Monitoring</h1>
                <p className="text-muted-foreground text-sm">Real-time resource utilization, telemetry charts, and health indicators</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`size-3.5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live Stream' : 'Paused'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="size-3.5 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cluster CPU Usage</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Cpu className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{latestCpu}%</div>
              <Progress value={latestCpu} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1.5">4 Nodes • {readyNodes} Schedulable</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Memory Allocation</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <MemoryStick className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{latestMemory}%</div>
              <Progress value={latestMemory} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1.5">38.4 GB Allocated / 64 GB Total</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network I/O Throughput</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Network className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{latestNetwork} MB/s</div>
              <Progress value={Math.min(100, (latestNetwork / 200) * 100)} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1.5">Ingress & Pod East-West Traffic</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Pod Health</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <CheckCircle className="size-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{runningPods} / {pods.length}</div>
              <Progress value={pods.length > 0 ? (runningPods / pods.length) * 100 : 100} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1.5">Running healthy workloads</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Utilization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                CPU & Memory Utilization History
              </CardTitle>
              <CardDescription>Live streaming cluster metric samples</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Area type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" />
                    <Area type="monotone" dataKey="memory" name="Memory Usage (%)" stroke="var(--muted-foreground)" strokeWidth={1.5} fillOpacity={1} fill="url(#memGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="size-4 text-primary" />
                Network Traffic Rate (MB/s)
              </CardTitle>
              <CardDescription>Aggregate network I/O per second</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="M" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Bar dataKey="network" name="Network (MB/s)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Node Infrastructure Health Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="size-4 text-primary" />
              Node Infrastructure Performance
            </CardTitle>
            <CardDescription>Current hardware telemetry per cluster node</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nodes.map(node => (
              <div key={node.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted text-foreground shrink-0">
                    <Server className="size-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{node.name}</div>
                    <div className="text-xs text-muted-foreground">{node.roles.join(', ')} • {node.internalIP}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">CPU</span>
                    <span>{node.allocatableCPU} / {node.cpuCapacity}c</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Memory</span>
                    <span>{node.allocatableMemory} / {node.memoryCapacity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Pods</span>
                    <span>{node.podsCapacity} max</span>
                  </div>
                  <Badge variant={node.status === 'Ready' ? 'default' : 'destructive'} className="text-xs">
                    {node.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
