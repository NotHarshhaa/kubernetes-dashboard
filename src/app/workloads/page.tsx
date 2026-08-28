"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/contexts/toast-context"
import { apiClient, WorkloadSummary, Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod } from "@/lib/api-client"
import { PodLogsDialog } from "@/components/pod-logs-dialog"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import {
  Boxes,
  Database,
  Layers,
  Container,
  Play,
  RotateCcw,
  Sliders,
  Terminal,
  FileCode2,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Zap,
  MoreHorizontal,
  Power,
  ArrowUpRight
} from "lucide-react"

export default function WorkloadsPage() {
  const [data, setData] = useState<WorkloadSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  // Interactive Dialogs
  const [scaleDialog, setScaleDialog] = useState<{
    open: boolean
    kind: 'Deployment' | 'StatefulSet'
    name: string
    namespace: string
    currentReplicas: number
    targetReplicas: number
  }>({
    open: false,
    kind: 'Deployment',
    name: '',
    namespace: 'default',
    currentReplicas: 1,
    targetReplicas: 1
  })

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
    kind: string
    name: string
    namespace: string
  }>({
    open: false,
    kind: 'Deployment',
    name: '',
    namespace: 'default'
  })

  const { success, error: showError } = useToast()

  const fetchWorkloads = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.getWorkloads(
        selectedNamespace === 'all' ? undefined : selectedNamespace
      )
      setData(res)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workloads')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchWorkloads()
  }, [fetchWorkloads])

  // --- Handlers ---
  const handleScale = async () => {
    try {
      if (scaleDialog.kind === 'Deployment') {
        await apiClient.scaleDeployment(scaleDialog.name, scaleDialog.namespace, scaleDialog.targetReplicas)
      } else {
        await apiClient.scaleStatefulSet(scaleDialog.name, scaleDialog.namespace, scaleDialog.targetReplicas)
      }
      success(`${scaleDialog.kind} ${scaleDialog.name} scaled to ${scaleDialog.targetReplicas} replicas`)
      setScaleDialog(prev => ({ ...prev, open: false }))
      fetchWorkloads()
    } catch (err) {
      showError(`Scale failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleRestartDeployment = async (d: Deployment) => {
    try {
      await apiClient.restartDeployment(d.name, d.namespace)
      success(`Restart initiated for deployment ${d.name}`)
      fetchWorkloads()
    } catch (err) {
      showError(`Restart failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleRestartDaemonSet = async (ds: DaemonSet) => {
    try {
      await apiClient.restartDaemonSet(ds.name, ds.namespace)
      success(`Restart initiated for daemonset ${ds.name}`)
      fetchWorkloads()
    } catch (err) {
      showError(`Restart failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleTriggerCronJob = async (cj: CronJob) => {
    try {
      await apiClient.triggerCronJob(cj.name, cj.namespace)
      success(`Job triggered immediately from CronJob ${cj.name}`)
      fetchWorkloads()
    } catch (err) {
      showError(`Trigger failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleToggleCronJobSuspend = async (cj: CronJob) => {
    try {
      await apiClient.toggleCronJobSuspend(cj.name, cj.namespace)
      success(`CronJob ${cj.name} ${cj.suspend ? 'resumed' : 'suspended'}`)
      fetchWorkloads()
    } catch (err) {
      showError(`Action failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    if (!confirm(`Are you sure you want to delete ${kind} ${name} in namespace ${namespace}?`)) return
    try {
      await apiClient.deleteResource(kind, name, namespace)
      success(`${kind} ${name} deleted successfully`)
      fetchWorkloads()
    } catch (err) {
      showError(`Delete failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  // Filtered Lists
  const filterBySearch = (items: any[]) => {
    if (!searchTerm) return items
    return items.filter(
      item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredDeployments = filterBySearch(data?.deployments || [])
  const filteredStatefulSets = filterBySearch(data?.statefulSets || [])
  const filteredDaemonSets = filterBySearch(data?.daemonSets || [])
  const filteredJobs = filterBySearch(data?.jobs || [])
  const filteredCronJobs = filterBySearch(data?.cronJobs || [])
  const filteredPods = filterBySearch(data?.pods || [])

  const namespaces = Array.from(
    new Set([
      ...(data?.deployments.map(d => d.namespace) || []),
      ...(data?.statefulSets.map(s => s.namespace) || []),
      ...(data?.pods.map(p => p.namespace) || [])
    ])
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Boxes className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Workloads Hub
                </h1>
                <p className="text-muted-foreground text-sm">
                  Complete controller management for Deployments, StatefulSets, DaemonSets, Jobs, CronJobs & Pods
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWorkloads}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Global Workload Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Deployments
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data?.deployments.length || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              {data?.deployments.filter(d => d.readyReplicas === d.replicas).length || 0} ready
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              StatefulSets
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data?.statefulSets.length || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Database className="h-3 w-3 text-blue-500" />
              {data?.statefulSets.reduce((acc, s) => acc + s.readyReplicas, 0) || 0} pods
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              DaemonSets
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data?.daemonSets.length || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Layers className="h-3 w-3 text-purple-500" />
              {data?.daemonSets.reduce((acc, d) => acc + d.numberReady, 0) || 0} nodes
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Jobs
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data?.jobs.length || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-indigo-500" />
              {data?.jobs.filter(j => j.status === 'Complete').length || 0} succeeded
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              CronJobs
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data?.cronJobs.length || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              {data?.cronJobs.filter(c => !c.suspend).length || 0} active
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Pods
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data?.pods.length || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              {data?.pods.filter(p => p.status === 'Running').length || 0} running
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border bg-card">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workloads across all controllers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedNamespace}
              onChange={e => setSelectedNamespace(e.target.value)}
              className="h-9 px-3 rounded-md text-sm border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs for Controllers */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full h-auto p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deployments">Deployments ({filteredDeployments.length})</TabsTrigger>
            <TabsTrigger value="statefulsets">StatefulSets ({filteredStatefulSets.length})</TabsTrigger>
            <TabsTrigger value="daemonsets">DaemonSets ({filteredDaemonSets.length})</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({filteredJobs.length})</TabsTrigger>
            <TabsTrigger value="cronjobs">CronJobs ({filteredCronJobs.length})</TabsTrigger>
            <TabsTrigger value="pods">Pods ({filteredPods.length})</TabsTrigger>
          </TabsList>

          {/* 1. Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deployments Card Summary */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Deployments
                    </CardTitle>
                    <CardDescription>Stateless applications with rolling updates</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('deployments')} className="text-xs">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredDeployments.slice(0, 4).map(d => (
                    <div key={`${d.namespace}-${d.name}`} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.namespace} • {d.images[0]}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={d.readyReplicas === d.replicas ? 'default' : 'secondary'}>
                          {d.readyReplicas}/{d.replicas} Replicas
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* StatefulSets Card Summary */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      StatefulSets
                    </CardTitle>
                    <CardDescription>Databases and ordered stateful pods</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('statefulsets')} className="text-xs">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredStatefulSets.slice(0, 4).map(s => (
                    <div key={`${s.namespace}-${s.name}`} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.namespace} • Service: {s.serviceName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {s.readyReplicas}/{s.replicas} Pods
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* DaemonSets Card Summary */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      DaemonSets
                    </CardTitle>
                    <CardDescription>Node-level background system agents</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('daemonsets')} className="text-xs">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredDaemonSets.slice(0, 4).map(ds => (
                    <div key={`${ds.namespace}-${ds.name}`} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm text-foreground">{ds.name}</div>
                        <div className="text-xs text-muted-foreground">{ds.namespace} • {ds.images[0]}</div>
                      </div>
                      <Badge variant="secondary">
                        {ds.numberReady}/{ds.desiredNumberScheduled} Nodes
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* CronJobs & Jobs Card Summary */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      CronJobs & Batch Tasks
                    </CardTitle>
                    <CardDescription>Scheduled jobs and one-off executions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('cronjobs')} className="text-xs">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredCronJobs.slice(0, 4).map(cj => (
                    <div key={`${cj.namespace}-${cj.name}`} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm text-foreground">{cj.name}</div>
                        <div className="text-xs text-muted-foreground">{cj.namespace} • Schedule: <code className="font-mono text-xs">{cj.schedule}</code></div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleTriggerCronJob(cj)} className="h-7 text-xs">
                        <Play className="h-3 w-3 mr-1" /> Run Now
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2. Deployments Tab */}
          <TabsContent value="deployments">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Replicas</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.map(d => (
                    <TableRow key={`${d.namespace}-${d.name}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{d.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{d.namespace}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{d.readyReplicas}/{d.replicas}</span>
                          <Badge variant={d.readyReplicas === d.replicas ? 'default' : 'secondary'} className="text-xs">
                            {d.readyReplicas === d.replicas ? 'Ready' : 'Scaling'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono text-muted-foreground max-w-[200px] truncate" title={d.images.join(', ')}>
                          {d.images.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.age}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setScaleDialog({
                                open: true,
                                kind: 'Deployment',
                                name: d.name,
                                namespace: d.namespace,
                                currentReplicas: d.replicas,
                                targetReplicas: d.replicas
                              })
                            }
                            className="h-8 text-xs"
                          >
                            <Sliders className="h-3.5 w-3.5 mr-1" /> Scale
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRestartDeployment(d)}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Rolling Restart
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'Deployment', name: d.name, namespace: d.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete('Deployment', d.name, d.namespace)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 3. StatefulSets Tab */}
          <TabsContent value="statefulsets">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>StatefulSet Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Pods</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatefulSets.map(s => (
                    <TableRow key={`${s.namespace}-${s.name}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.namespace}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{s.serviceName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{s.readyReplicas}/{s.replicas}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{s.images.join(', ')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setScaleDialog({
                                open: true,
                                kind: 'StatefulSet',
                                name: s.name,
                                namespace: s.namespace,
                                currentReplicas: s.replicas,
                                targetReplicas: s.replicas
                              })
                            }
                            className="h-8 text-xs"
                          >
                            <Sliders className="h-3.5 w-3.5 mr-1" /> Scale
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'StatefulSet', name: s.name, namespace: s.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete('StatefulSet', s.name, s.namespace)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 4. DaemonSets Tab */}
          <TabsContent value="daemonsets">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DaemonSet Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Node Coverage</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDaemonSets.map(ds => (
                    <TableRow key={`${ds.namespace}-${ds.name}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{ds.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ds.namespace}</Badge></TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{ds.numberReady}/{ds.desiredNumberScheduled} scheduled</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{ds.images.join(', ')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleRestartDaemonSet(ds)} className="h-8 text-xs">
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restart
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'DaemonSet', name: ds.name, namespace: ds.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete('DaemonSet', ds.name, ds.namespace)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 5. Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map(j => (
                    <TableRow key={`${j.namespace}-${j.name}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{j.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{j.namespace}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={j.status === 'Complete' ? 'default' : 'secondary'}>
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{j.duration || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(j.startTime).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setYamlDialog({ open: true, kind: 'Job', name: j.name, namespace: j.namespace })}
                            className="h-8 text-xs"
                          >
                            <FileCode2 className="h-3.5 w-3.5 mr-1" /> YAML
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete('Job', j.name, j.namespace)}
                            className="h-8 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 6. CronJobs Tab */}
          <TabsContent value="cronjobs">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CronJob Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCronJobs.map(cj => (
                    <TableRow key={`${cj.namespace}-${cj.name}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{cj.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{cj.namespace}</Badge></TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {cj.schedule}
                      </TableCell>
                      <TableCell>
                        <Badge variant={!cj.suspend ? 'default' : 'secondary'}>
                          {!cj.suspend ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cj.lastScheduleTime ? new Date(cj.lastScheduleTime).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="default" onClick={() => handleTriggerCronJob(cj)} className="h-8 text-xs">
                            <Play className="h-3 w-3 mr-1" /> Run Now
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleCronJobSuspend(cj)}>
                                <Power className="h-4 w-4 mr-2" /> {cj.suspend ? 'Resume Schedule' : 'Suspend Schedule'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'CronJob', name: cj.name, namespace: cj.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete('CronJob', cj.name, cj.namespace)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 7. Pods Tab */}
          <TabsContent value="pods">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pod Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Restarts</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPods.map(p => (
                    <TableRow key={`${p.namespace}-${p.name}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Container className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.namespace}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'Running' ? 'default' : 'secondary'}>
                          {p.status} ({p.ready})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{p.restarts}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.node}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.ip}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setLogsDialog({
                                open: true,
                                podName: p.name,
                                namespace: p.namespace,
                                containers: p.containers || [{ name: 'main' }]
                              })
                            }
                            className="h-8 text-xs"
                          >
                            <Terminal className="h-3.5 w-3.5 mr-1" /> Logs
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'Pod', name: p.name, namespace: p.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => apiClient.restartPod(p.name, p.namespace).then(() => { success(`Pod restarted`); fetchWorkloads() })}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Restart Pod
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete('Pod', p.name, p.namespace)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Scale Dialog */}
        <Dialog open={scaleDialog.open} onOpenChange={open => setScaleDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Scale {scaleDialog.kind}: {scaleDialog.name}
              </DialogTitle>
              <DialogDescription>
                Set desired replica count for this workload in {scaleDialog.namespace}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Target Replicas:</span>
                <span className="text-xl font-bold text-primary">{scaleDialog.targetReplicas}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScaleDialog(prev => ({ ...prev, targetReplicas: Math.max(0, prev.targetReplicas - 1) }))}
                >
                  -
                </Button>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scaleDialog.targetReplicas}
                  onChange={e => setScaleDialog(prev => ({ ...prev, targetReplicas: parseInt(e.target.value) || 0 }))}
                  className="flex-1 accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScaleDialog(prev => ({ ...prev, targetReplicas: prev.targetReplicas + 1 }))}
                >
                  +
                </Button>
              </div>

              <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                Current replicas: <strong className="text-foreground">{scaleDialog.currentReplicas}</strong>.
                Scaling will update the cluster controller immediately.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setScaleDialog(prev => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button onClick={handleScale}>
                Apply Scale
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pod Logs Dialog */}
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
          resourceKind={yamlDialog.kind}
          resourceName={yamlDialog.name}
          namespace={yamlDialog.namespace}
        />
      </div>
    </DashboardLayout>
  )
}
