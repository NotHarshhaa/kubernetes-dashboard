"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient, Deployment } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Database, 
  MoreHorizontal,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Trash2,
  Download,
  RotateCcw,
  Sliders,
  FileCode2,
  Layers,
  ArrowUpRight
} from "lucide-react"

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeployments, setSelectedDeployments] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Scale Modal
  const [scaleDialog, setScaleDialog] = useState<{
    open: boolean
    deployment: Deployment | null
    replicas: number
  }>({
    open: false,
    deployment: null,
    replicas: 1
  })

  // YAML Modal
  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    name: string
    namespace: string
  }>({
    open: false,
    name: '',
    namespace: 'default'
  })

  const { success, error: showError, info } = useToast()

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getDeployments(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setDeployments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchDeployments, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchDeployments])

  const handleScaleDeployment = async () => {
    if (!scaleDialog.deployment) return
    try {
      await apiClient.scaleDeployment(
        scaleDialog.deployment.name,
        scaleDialog.deployment.namespace,
        scaleDialog.replicas
      )
      success(`Deployment ${scaleDialog.deployment.name} scaled to ${scaleDialog.replicas} replicas`)
      setScaleDialog({ open: false, deployment: null, replicas: 1 })
      fetchDeployments()
    } catch (error) {
      showError(`Failed to scale deployment`)
    }
  }

  const handleRestartDeployment = async (d: Deployment) => {
    try {
      await apiClient.restartDeployment(d.name, d.namespace)
      success(`Restart initiated for deployment ${d.name}`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to restart deployment ${d.name}`)
    }
  }

  const handleDeleteDeployment = async (d: Deployment) => {
    if (!confirm(`Delete deployment ${d.name} in namespace ${d.namespace}?`)) return
    try {
      await apiClient.deleteResource('Deployment', d.name, d.namespace)
      success(`Deployment ${d.name} deleted`)
      fetchDeployments()
    } catch (error) {
      showError(`Failed to delete deployment ${d.name}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDeployments.size === 0) {
      info('No deployments selected')
      return
    }
    if (!confirm(`Delete ${selectedDeployments.size} selected deployments?`)) return
    try {
      for (const key of Array.from(selectedDeployments)) {
        const [ns, name] = key.split(':')
        await apiClient.deleteResource('Deployment', name, ns)
      }
      success(`${selectedDeployments.size} deployments deleted`)
      setSelectedDeployments(new Set())
      fetchDeployments()
    } catch (error) {
      showError('Bulk delete failed')
    }
  }

  const toggleSelection = (key: string) => {
    setSelectedDeployments(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => {
    if (selectedDeployments.size === filteredDeployments.length) {
      setSelectedDeployments(new Set())
    } else {
      setSelectedDeployments(new Set(filteredDeployments.map(d => `${d.namespace}:${d.name}`)))
    }
  }

  const exportDeploymentData = () => {
    const csvContent = [
      ['Name', 'Namespace', 'Replicas', 'Ready', 'Available', 'Images', 'Age'],
      ...filteredDeployments.map(d => [
        d.name,
        d.namespace,
        d.replicas.toString(),
        d.readyReplicas.toString(),
        d.availableReplicas.toString(),
        d.images.join('; '),
        d.age || '-'
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

  const getStatusBadge = (d: Deployment) => {
    if (d.readyReplicas === d.replicas && d.replicas > 0) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>
    } else if (d.readyReplicas > 0) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"><Clock className="w-3 h-3 mr-1" />Progressing</Badge>
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />Not Ready</Badge>
    }
  }

  const filteredDeployments = deployments.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "ready" && d.readyReplicas === d.replicas) ||
                         (statusFilter === "progressing" && d.readyReplicas > 0 && d.readyReplicas < d.replicas) ||
                         (statusFilter === "notready" && d.readyReplicas === 0)
    return matchesSearch && matchesStatus
  })

  const readyDeployments = deployments.filter(d => d.readyReplicas === d.replicas).length
  const progressingDeployments = deployments.filter(d => d.readyReplicas > 0 && d.readyReplicas < d.replicas).length
  const totalReplicas = deployments.reduce((acc, d) => acc + d.replicas, 0)

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Deployments</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Scale, rolling restarts, replica management, and container rollout strategies</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`rounded-xl ${autoRefresh ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Streaming' : 'Auto Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportDeploymentData} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchDeployments} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deployments</CardTitle>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <Database className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{deployments.length}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Across all namespaces</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready / Healthy</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-emerald-600">{readyDeployments}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Fully deployed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progressing</CardTitle>
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-amber-600">{progressingDeployments}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">In rollout phase</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Replicas</CardTitle>
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-orange-600">{totalReplicas}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Pods provisioned</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search deployments..."
                  className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="px-3 py-2 h-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm"
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                >
                  <option value="all">All Namespaces</option>
                  {Array.from(new Set(deployments.map(d => d.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 h-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="ready">Ready</option>
                  <option value="progressing">Progressing</option>
                  <option value="notready">Not Ready</option>
                </select>

                {selectedDeployments.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="rounded-xl h-10 px-3 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedDeployments.size})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox 
                      checked={selectedDeployments.size === filteredDeployments.length && filteredDeployments.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Deployment Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Replicas</TableHead>
                  <TableHead>Container Images</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.map((d) => {
                  const depKey = `${d.namespace}:${d.name}`
                  const isSelected = selectedDeployments.has(depKey)
                  
                  return (
                    <TableRow
                      key={depKey}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(depKey)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-500" />
                          <span>{d.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{d.namespace}</Badge></TableCell>
                      <TableCell>{getStatusBadge(d)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{d.readyReplicas}/{d.replicas}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 max-w-[200px] truncate" title={d.images.join(', ')}>
                        {d.images.join(', ')}
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
                                deployment: d,
                                replicas: d.replicas
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
                              <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: d.name, namespace: d.namespace })}>
                                <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDeployment(d)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Deployment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Scale Dialog */}
        <Dialog open={scaleDialog.open} onOpenChange={open => setScaleDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-500" />
                Scale Deployment: {scaleDialog.deployment?.name}
              </DialogTitle>
              <DialogDescription>
                Adjust desired replicas for {scaleDialog.deployment?.namespace}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Target Replicas:</span>
                <span className="text-2xl font-bold text-orange-600">{scaleDialog.replicas}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setScaleDialog(prev => ({ ...prev, replicas: Math.max(0, prev.replicas - 1) }))}
                  className="rounded-xl"
                >
                  -
                </Button>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scaleDialog.replicas}
                  onChange={e => setScaleDialog(prev => ({ ...prev, replicas: parseInt(e.target.value) || 0 }))}
                  className="flex-1 accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <Button
                  variant="outline"
                  onClick={() => setScaleDialog(prev => ({ ...prev, replicas: prev.replicas + 1 }))}
                  className="rounded-xl"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setScaleDialog(prev => ({ ...prev, open: false }))} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleScaleDeployment} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                Apply Scale
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* YAML Dialog */}
        <YamlViewerDialog
          open={yamlDialog.open}
          onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
          resourceKind="Deployment"
          resourceName={yamlDialog.name}
          namespace={yamlDialog.namespace}
        />
      </div>
    </DashboardLayout>
  )
}
