"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  AlertTriangle,
  Clock,
  Zap,
  MoreHorizontal,
  Plus,
  ExternalLink,
  Power,
  Server,
  Activity,
  ArrowUpRight,
  Sparkles
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

  const { success, error: showError, info } = useToast()

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
      <div className="space-y-8 pb-12">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Workloads Hub
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Complete controller management for Deployments, StatefulSets, DaemonSets, Jobs, CronJobs & Pods
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWorkloads}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin text-orange-500' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Global Workload Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Deployments
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {data?.deployments.length || 0}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {data?.deployments.filter(d => d.readyReplicas === d.replicas).length || 0} ready
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              StatefulSets
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {data?.statefulSets.length || 0}
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              {data?.statefulSets.reduce((acc, s) => acc + s.readyReplicas, 0) || 0} pods
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              DaemonSets
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {data?.daemonSets.length || 0}
            </div>
            <div className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {data?.daemonSets.reduce((acc, d) => acc + d.numberReady, 0) || 0} nodes
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jobs
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {data?.jobs.length || 0}
            </div>
            <div className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {data?.jobs.filter(j => j.status === 'Complete').length || 0} succeeded
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              CronJobs
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {data?.cronJobs.length || 0}
            </div>
            <div className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {data?.cronJobs.filter(c => !c.suspend).length || 0} active
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Pods
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {data?.pods.length || 0}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {data?.pods.filter(p => p.status === 'Running').length || 0} running
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search workloads across all controllers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedNamespace}
              onChange={e => setSelectedNamespace(e.target.value)}
              className="px-4 py-2 h-10 rounded-xl text-sm font-medium border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur rounded-2xl h-auto">
            <TabsTrigger value="overview" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="deployments" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Deployments ({filteredDeployments.length})
            </TabsTrigger>
            <TabsTrigger value="statefulsets" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              StatefulSets ({filteredStatefulSets.length})
            </TabsTrigger>
            <TabsTrigger value="daemonsets" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              DaemonSets ({filteredDaemonSets.length})
            </TabsTrigger>
            <TabsTrigger value="jobs" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Jobs ({filteredJobs.length})
            </TabsTrigger>
            <TabsTrigger value="cronjobs" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              CronJobs ({filteredCronJobs.length})
            </TabsTrigger>
            <TabsTrigger value="pods" className="rounded-xl py-2 text-xs md:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Pods ({filteredPods.length})
            </TabsTrigger>
          </TabsList>

          {/* 1. Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deployments Card Summary */}
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Database className="h-5 w-5 text-orange-500" />
                      Deployments
                    </CardTitle>
                    <CardDescription>Stateless applications with rolling updates</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('deployments')} className="text-xs text-orange-600 dark:text-orange-400">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {filteredDeployments.slice(0, 4).map(d => (
                    <div key={`${d.namespace}-${d.name}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{d.name}</div>
                        <div className="text-xs text-slate-500">{d.namespace} • {d.images[0]}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={d.readyReplicas === d.replicas ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' : 'border-amber-500/30 text-amber-600 bg-amber-500/10'}>
                          {d.readyReplicas}/{d.replicas} Replicas
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* StatefulSets Card Summary */}
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      StatefulSets
                    </CardTitle>
                    <CardDescription>Databases and ordered stateful pods</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('statefulsets')} className="text-xs text-blue-600 dark:text-blue-400">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {filteredStatefulSets.slice(0, 4).map(s => (
                    <div key={`${s.namespace}-${s.name}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.namespace} • Service: {s.serviceName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/10">
                          {s.readyReplicas}/{s.replicas} Pods
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* DaemonSets Card Summary */}
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-500" />
                      DaemonSets
                    </CardTitle>
                    <CardDescription>Node-level background system agents</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('daemonsets')} className="text-xs text-purple-600 dark:text-purple-400">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {filteredDaemonSets.slice(0, 4).map(ds => (
                    <div key={`${ds.namespace}-${ds.name}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{ds.name}</div>
                        <div className="text-xs text-slate-500">{ds.namespace} • {ds.images[0]}</div>
                      </div>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-600 bg-purple-500/10">
                        {ds.numberReady}/{ds.desiredNumberScheduled} Nodes
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* CronJobs & Jobs Card Summary */}
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      CronJobs & Batch Tasks
                    </CardTitle>
                    <CardDescription>Scheduled jobs and one-off executions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('cronjobs')} className="text-xs text-amber-600 dark:text-amber-400">
                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {filteredCronJobs.slice(0, 4).map(cj => (
                    <div key={`${cj.namespace}-${cj.name}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{cj.name}</div>
                        <div className="text-xs text-slate-500">{cj.namespace} • Schedule: <code className="text-amber-600 font-mono">{cj.schedule}</code></div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleTriggerCronJob(cj)} className="h-8 px-2 text-xs rounded-lg border-amber-500/40 text-amber-600 hover:bg-amber-500/10">
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${d.namespace}-${d.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-500" />
                          <span className="text-slate-900 dark:text-white font-semibold">{d.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{d.namespace}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{d.readyReplicas}/{d.replicas}</span>
                          {d.readyReplicas === d.replicas ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Ready</Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Scaling</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono text-slate-500 max-w-[200px] truncate" title={d.images.join(', ')}>
                          {d.images.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{d.age}</TableCell>
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
                            className="h-8 text-xs rounded-lg"
                          >
                            <Sliders className="h-3.5 w-3.5 mr-1" /> Scale
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
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
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete('Deployment', d.name, d.namespace)}>
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${s.namespace}-${s.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-blue-500" />
                          <span className="text-slate-900 dark:text-white font-semibold">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{s.namespace}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{s.serviceName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{s.readyReplicas}/{s.replicas}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{s.images.join(', ')}</TableCell>
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
                            className="h-8 text-xs rounded-lg"
                          >
                            <Sliders className="h-3.5 w-3.5 mr-1" /> Scale
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'StatefulSet', name: s.name, namespace: s.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete('StatefulSet', s.name, s.namespace)}>
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${ds.namespace}-${ds.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-purple-500" />
                          <span className="text-slate-900 dark:text-white font-semibold">{ds.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{ds.namespace}</Badge></TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{ds.numberReady}/{ds.desiredNumberScheduled} scheduled</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{ds.images.join(', ')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleRestartDaemonSet(ds)} className="h-8 text-xs rounded-lg">
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restart
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, kind: 'DaemonSet', name: ds.name, namespace: ds.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete('DaemonSet', ds.name, ds.namespace)}>
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${j.namespace}-${j.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-indigo-500" />
                          <span className="text-slate-900 dark:text-white font-semibold">{j.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{j.namespace}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={j.status === 'Complete' ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' : 'border-amber-500/40 text-amber-600 bg-amber-500/10'}>
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{j.duration || '-'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{new Date(j.startTime).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setYamlDialog({ open: true, kind: 'Job', name: j.name, namespace: j.namespace })}
                            className="h-8 text-xs rounded-lg"
                          >
                            <FileCode2 className="h-3.5 w-3.5 mr-1" /> YAML
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete('Job', j.name, j.namespace)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${cj.namespace}-${cj.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="text-slate-900 dark:text-white font-semibold">{cj.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{cj.namespace}</Badge></TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {cj.schedule}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={!cj.suspend ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' : 'border-slate-500/40 text-slate-500'}>
                          {!cj.suspend ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {cj.lastScheduleTime ? new Date(cj.lastScheduleTime).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="default" onClick={() => handleTriggerCronJob(cj)} className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                            <Play className="h-3 w-3 mr-1" /> Run Now
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
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
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete('CronJob', cj.name, cj.namespace)}>
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                    <TableRow key={`${p.namespace}-${p.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Container className="h-4 w-4 text-emerald-500" />
                          <span className="text-slate-900 dark:text-white font-semibold">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{p.namespace}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.status === 'Running' ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' : 'border-amber-500/40 text-amber-600 bg-amber-500/10'}>
                          {p.status} ({p.ready})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{p.restarts}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{p.node}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{p.ip}</TableCell>
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
                            className="h-8 text-xs rounded-lg text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                          >
                            <Terminal className="h-3.5 w-3.5 mr-1" /> Logs
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
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
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete('Pod', p.name, p.namespace)}>
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
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-500" />
                Scale {scaleDialog.kind}: {scaleDialog.name}
              </DialogTitle>
              <DialogDescription>
                Set desired replica count for this workload in {scaleDialog.namespace}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Target Replicas:</span>
                <span className="text-2xl font-bold text-orange-600">{scaleDialog.targetReplicas}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setScaleDialog(prev => ({ ...prev, targetReplicas: Math.max(0, prev.targetReplicas - 1) }))}
                  className="rounded-xl"
                >
                  -
                </Button>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scaleDialog.targetReplicas}
                  onChange={e => setScaleDialog(prev => ({ ...prev, targetReplicas: parseInt(e.target.value) || 0 }))}
                  className="flex-1 accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <Button
                  variant="outline"
                  onClick={() => setScaleDialog(prev => ({ ...prev, targetReplicas: prev.targetReplicas + 1 }))}
                  className="rounded-xl"
                >
                  +
                </Button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500">
                Current replicas: <strong className="text-slate-700 dark:text-slate-200">{scaleDialog.currentReplicas}</strong>.
                Scaling will immediately update the cluster deployment specification.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setScaleDialog(prev => ({ ...prev, open: false }))} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleScale} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
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
