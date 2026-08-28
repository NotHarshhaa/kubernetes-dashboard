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
import { Input } from "@/components/ui/input"
import { apiClient, Node } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  Server, 
  MoreHorizontal,
  RefreshCw,
  Search,
  Cpu,
  MemoryStick,
  CheckCircle,
  AlertTriangle,
  Download,
  Copy,
  Ban,
  Power,
  FileCode2,
  Eye
} from "lucide-react"

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(false)

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    node: Node | null
  }>({
    open: false,
    node: null
  })

  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    name: string
  }>({
    open: false,
    name: ''
  })

  const { success, error: showError } = useToast()

  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getNodes()
      setNodes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNodes()
  }, [fetchNodes])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchNodes, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchNodes])

  const cordonNode = async (node: Node, cordon: boolean) => {
    try {
      await apiClient.cordonNode(node.name, cordon)
      success(`Node ${node.name} ${cordon ? 'cordoned' : 'uncordoned'}`)
      fetchNodes()
    } catch (error) {
      showError(`Failed to update cordon state on ${node.name}`)
    }
  }

  const drainNode = async (node: Node) => {
    if (!confirm(`Drain all workloads from node ${node.name}?`)) return
    try {
      await apiClient.drainNode(node.name)
      success(`Node ${node.name} drained successfully`)
      fetchNodes()
    } catch (error) {
      showError(`Failed to drain node ${node.name}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
  }

  const exportNodeData = () => {
    const csvContent = [
      ['Name', 'Status', 'Roles', 'Version', 'Internal IP', 'CPU Capacity', 'Memory Capacity', 'Pods Capacity'],
      ...filteredNodes.map(node => [
        node.name,
        node.status,
        node.roles.join('; '),
        node.version,
        node.internalIP,
        node.cpuCapacity,
        node.memoryCapacity,
        node.podsCapacity
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nodes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    success('Node data exported successfully')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>
      case 'SchedulingDisabled':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"><Ban className="w-3 h-3 mr-1" />Cordoned</Badge>
      default:
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />Not Ready</Badge>
    }
  }

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.roles.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "ready" && node.status === 'Ready') ||
                         (statusFilter === "cordoned" && node.status === 'SchedulingDisabled') ||
                         (statusFilter === "notready" && node.status === 'NotReady')
    return matchesSearch && matchesStatus
  })

  const readyNodes = nodes.filter(n => n.status === 'Ready').length
  const totalCPU = nodes.reduce((acc, node) => acc + parseInt(node.cpuCapacity || '0'), 0)

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Nodes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cluster compute infrastructure, allocatable resources, node health, and cordoning</p>
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
            <Button variant="outline" size="sm" onClick={exportNodeData} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchNodes} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nodes</CardTitle>
              <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600">
                <Server className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{nodes.length}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Cluster pool</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready Nodes</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-emerald-600">{readyNodes}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Schedulable</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total CPU</CardTitle>
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                <Cpu className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-orange-600">{totalCPU} cores</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Compute capacity</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kubernetes</CardTitle>
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                <Server className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-purple-600">{nodes[0]?.version || 'v1.28.2'}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Kubelet Runtime</p>
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
                  placeholder="Search nodes by name or role..."
                  className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="px-3 py-2 h-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="ready">Ready</option>
                  <option value="cordoned">Cordoned</option>
                  <option value="notready">Not Ready</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Node Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Internal IP</TableHead>
                  <TableHead>CPU / Memory</TableHead>
                  <TableHead>Pod Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.map((node) => (
                  <TableRow key={node.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-cyan-600" />
                        <span>{node.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(node.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {node.roles.map(r => (
                          <Badge key={r} variant="secondary" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{node.version}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                        <span>{node.internalIP}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(node.internalIP)} className="h-6 w-6 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {node.cpuCapacity} cores / {node.memoryCapacity}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{node.podsCapacity} pods</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cordonNode(node, node.status !== 'SchedulingDisabled')}
                          className="h-8 text-xs rounded-lg"
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          {node.status === 'SchedulingDisabled' ? 'Uncordon' : 'Cordon'}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, node })}>
                              <Eye className="h-4 w-4 mr-2" /> View Node Info
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setYamlDialog({ open: true, name: node.name })}>
                              <FileCode2 className="h-4 w-4 mr-2" /> View YAML
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-amber-600" onClick={() => drainNode(node)}>
                              <Power className="h-4 w-4 mr-2" /> Drain Node
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Node Details Dialog */}
        <Dialog open={detailsDialog.open} onOpenChange={open => setDetailsDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-600" />
                Node Details: {detailsDialog.node?.name}
              </DialogTitle>
              <DialogDescription>
                Kernel: {detailsDialog.node?.kernelVersion} • OS: {detailsDialog.node?.osImage}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Container Runtime</span>
                  <p className="font-semibold font-mono text-xs">{detailsDialog.node?.containerRuntime}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Kubelet Version</span>
                  <p className="font-semibold font-mono text-xs">{detailsDialog.node?.version}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Allocatable CPU</span>
                  <p className="font-semibold">{detailsDialog.node?.allocatableCPU} / {detailsDialog.node?.cpuCapacity} cores</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-medium">Allocatable Memory</span>
                  <p className="font-semibold">{detailsDialog.node?.allocatableMemory} / {detailsDialog.node?.memoryCapacity}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailsDialog(prev => ({ ...prev, open: false }))} className="rounded-xl">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* YAML Dialog */}
        <YamlViewerDialog
          open={yamlDialog.open}
          onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
          resourceKind="Node"
          resourceName={yamlDialog.name}
          namespace=""
        />
      </div>
    </DashboardLayout>
  )
}
