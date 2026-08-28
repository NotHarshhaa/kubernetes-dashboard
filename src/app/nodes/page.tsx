"use client"

import { useEffect, useState, useCallback } from "react"
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
        return <Badge variant="default" className="text-xs gap-1"><CheckCircle className="w-3 h-3" />Ready</Badge>
      case 'SchedulingDisabled':
        return <Badge variant="secondary" className="text-xs gap-1"><Ban className="w-3 h-3" />Cordoned</Badge>
      default:
        return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />Not Ready</Badge>
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
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Server className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Nodes</h1>
                <p className="text-muted-foreground text-sm">Cluster compute infrastructure, allocatable resources, node health, and cordoning</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Auto Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportNodeData}>
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchNodes}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Nodes</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Server className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{nodes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cluster pool</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ready Nodes</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{readyNodes}</div>
              <p className="text-xs text-muted-foreground mt-1">Schedulable</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total CPU</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Cpu className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{totalCPU} cores</div>
              <p className="text-xs text-muted-foreground mt-1">Compute capacity</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kubernetes</CardTitle>
              <div className="p-1.5 rounded-md bg-muted">
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{nodes[0]?.version || 'v1.28.2'}</div>
              <p className="text-xs text-muted-foreground mt-1">Kubelet Runtime</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search nodes by name or role..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
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
              <TableHeader>
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
                  <TableRow key={node.name}>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
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
                      <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <span>{node.internalIP}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(node.internalIP)} className="h-6 w-6 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {node.cpuCapacity}c / {node.memoryCapacity}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{node.podsCapacity} pods</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cordonNode(node, node.status !== 'SchedulingDisabled')}
                          className="h-8 text-xs"
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          {node.status === 'SchedulingDisabled' ? 'Uncordon' : 'Cordon'}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                            <DropdownMenuItem className="text-destructive" onClick={() => drainNode(node)}>
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
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Node Details: {detailsDialog.node?.name}
              </DialogTitle>
              <DialogDescription>
                Kernel: {detailsDialog.node?.kernelVersion} • OS: {detailsDialog.node?.osImage}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/40">
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Container Runtime</span>
                  <p className="font-semibold font-mono text-xs">{detailsDialog.node?.containerRuntime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Kubelet Version</span>
                  <p className="font-semibold font-mono text-xs">{detailsDialog.node?.version}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Allocatable CPU</span>
                  <p className="font-semibold">{detailsDialog.node?.allocatableCPU} / {detailsDialog.node?.cpuCapacity} cores</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Allocatable Memory</span>
                  <p className="font-semibold">{detailsDialog.node?.allocatableMemory} / {detailsDialog.node?.memoryCapacity}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setDetailsDialog(prev => ({ ...prev, open: false }))}>
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
