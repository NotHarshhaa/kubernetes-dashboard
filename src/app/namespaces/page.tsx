"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, Namespace } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { useRealTimeNamespaces } from "../../hooks/use-real-time-namespaces"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Copy, 
  Eye, 
  Trash2,
  Activity,
  Calendar,
  Layers,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download} from "lucide-react"

export default function NamespacesPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const { success, error: showError } = useToast()
  
  interface NamespaceEvent {
    type: string
    reason: string
    message: string
    namespaceName: string
    timestamp: string
  }
  
  // Use real-time namespaces hook or demo fallback based on environment
  const realTimeData = useRealTimeNamespaces()
  const { 
    namespaces, 
    namespaceEvents, 
    isConnected, 
    lastUpdate, 
    getNamespaceEvents 
  } = isDemoMode ? {
    namespaces: [
      {
        name: 'default',
        status: 'Active',
        age: '30d',
        labels: {},
        annotations: {},
        resourceQuotas: {
          pods: '10',
          services: '5',
          secrets: '10',
          configMaps: '10'
        },
        limits: {
          cpu: '2',
          memory: '4Gi'
        }
      },
      {
        name: 'kube-system',
        status: 'Active',
        age: '30d',
        labels: {},
        annotations: {},
        resourceQuotas: {
          pods: '20',
          services: '10',
          secrets: '20',
          configMaps: '20'
        },
        limits: {
          cpu: '4',
          memory: '8Gi'
        }
      },
      {
        name: 'production',
        status: 'Active',
        age: '15d',
        labels: {
          'environment': 'production',
          'team': 'backend'
        },
        annotations: {},
        resourceQuotas: {
          pods: '50',
          services: '20',
          secrets: '30',
          configMaps: '20'
        },
        limits: {
          cpu: '10',
          memory: '16Gi'
        }
      },
      {
        name: 'staging',
        status: 'Active',
        age: '10d',
        labels: {
          'environment': 'staging',
          'team': 'backend'
        },
        annotations: {},
        resourceQuotas: {
          pods: '30',
          services: '15',
          secrets: '20',
          configMaps: '15'
        },
        limits: {
          cpu: '6',
          memory: '12Gi'
        }
      },
      {
        name: 'development',
        status: 'Active',
        age: '7d',
        labels: {
          'environment': 'development',
          'team': 'frontend'
        },
        annotations: {},
        resourceQuotas: {
          pods: '25',
          services: '10',
          secrets: '15',
          configMaps: '15'
        },
        limits: {
          cpu: '4',
          memory: '8Gi'
        }
      }
    ],
    namespaceEvents: [],
    isConnected: false,
    lastUpdate: new Date(),
    getNamespaceEvents: (name: string) => []
  } : realTimeData

  // Demo mode - fallback to original implementation with real-time features
  const [namespacesState, setNamespacesState] = useState<Namespace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null)
  const [namespaceEventsState, setNamespaceEventsState] = useState<NamespaceEvent[] | null>(null)
  const [showEventsDialog, setShowEventsDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchNamespaces = useCallback(async () => {
    if (isDemoMode) return // Skip fetch in demo mode - use mock data instead
    
    try {
      setLoading(true)
      const data = await apiClient.getNamespaces()
      setNamespacesState(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch namespaces')
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    if (!isDemoMode) {
      fetchNamespaces()
    } else {
      // Initialize demo data
      setLoading(false)
    }
  }, [fetchNamespaces, isDemoMode])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh && !isDemoMode) {
      interval = setInterval(fetchNamespaces, 10000) // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchNamespaces, isDemoMode])

  // Use appropriate data based on mode
  const currentNamespaces = isDemoMode ? namespaces : namespacesState
  const currentLastUpdate = isDemoMode ? lastUpdate : new Date()
  const currentIsConnected = isDemoMode ? false : isConnected

  const filteredNamespaces = currentNamespaces.filter((namespace: Namespace) => {
    const matchesSearch = namespace.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || namespace.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>
      case 'terminating':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success("Copied to clipboard")
  }

  const handleSelectNamespace = (namespaceName: string, checked: boolean) => {
    const newSelected = new Set(selectedNamespaces)
    if (checked) {
      newSelected.add(namespaceName)
    } else {
      newSelected.delete(namespaceName)
    }
    setSelectedNamespaces(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allNamespaces = new Set(filteredNamespaces.map(ns => ns.name))
      setSelectedNamespaces(allNamespaces)
      setShowBulkActions(true)
    } else {
      setSelectedNamespaces(new Set())
      setShowBulkActions(false)
    }
  }

  const handleBulkAction = (action: string) => {
    if (action === 'export') {
      exportSelectedNamespaces()
    } else if (action === 'delete') {
      deleteSelectedNamespaces()
    }
    setSelectedNamespaces(new Set())
    setShowBulkActions(false)
  }

  const exportSelectedNamespaces = () => {
    const selectedData = filteredNamespaces.filter(ns => selectedNamespaces.has(ns.name))
    const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'selected-namespaces.json'
    a.click()
    URL.revokeObjectURL(url)
    success(`Exported ${selectedNamespaces.size} namespaces`)
  }

  const deleteSelectedNamespaces = () => {
    if (isDemoMode) {
      success(`Deleted ${selectedNamespaces.size} namespaces (demo mode)`)
      return
    }
    // In real mode, this would call the API to delete namespaces
    success(`Deleted ${selectedNamespaces.size} namespaces`)
  }

  const fetchNamespaceEvents = async (namespace: Namespace) => {
    try {
      const events = getNamespaceEvents(namespace.name)
      setNamespaceEventsState(events)
      setSelectedNamespace(namespace)
      setShowEventsDialog(true)
    } catch (error) {
      console.error('Failed to fetch namespace events:', error)
    }
  }

  const exportNamespaceData = () => {
    const data = currentNamespaces.map((ns: Namespace) => ({
      name: ns.name,
      status: ns.status,
      age: ns.age,
      resourceQuotas: ns.resourceQuotas,
      limits: ns.limits
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'namespaces.json'
    a.click()
    URL.revokeObjectURL(url)
    success("Exported all namespaces data")
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
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
      </ProtectedRoute>
    )
  }

  const activeNamespaces = currentNamespaces.filter(n => n.status === 'Active').length

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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Namespaces</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Manage Kubernetes namespaces and resource isolation</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  isDemoMode 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : currentIsConnected 
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {isDemoMode ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Demo Mode</span>
                    </>
                  ) : currentIsConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Disconnected</span>
                    </>
                  )}
                </div>
                {currentLastUpdate && (
                  <span className="text-xs text-slate-500">
                    Last update: {currentLastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="lg" onClick={fetchNamespaces} className="rounded-xl">
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Namespaces</CardTitle>
                <Layers className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{currentNamespaces.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In the cluster</p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeNamespaces}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Healthy namespaces</p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Resource Quotas</CardTitle>
                <Shield className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {currentNamespaces.reduce((acc: number, ns: Namespace) => acc + parseInt(ns.resourceQuotas?.pods || '0'), 0)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total pod limits</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {selectedNamespaces.size} namespace{selectedNamespaces.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNamespaces(new Set())
                      setShowBulkActions(false)
                    }}
                  >
                    Clear selection
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('export')}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Namespace Management
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage Kubernetes namespaces with resource quotas and limits
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search namespaces..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="terminating">Terminating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`rounded-xl ${autoRefresh ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                    {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh'}
                  </Button>
                  <Button variant="outline" size="lg" onClick={exportNamespaceData} className="rounded-xl">
                    <Download className="h-5 w-5 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="lg" onClick={fetchNamespaces} className="rounded-xl">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedNamespaces.size === filteredNamespaces.length && filteredNamespaces.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all namespaces"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Resource Quotas</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Labels</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNamespaces.map((namespace: Namespace, index: number) => (
                    <motion.tr
                      key={namespace.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedNamespaces.has(namespace.name) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedNamespaces.has(namespace.name)}
                          onCheckedChange={(checked) => handleSelectNamespace(namespace.name, checked as boolean)}
                          aria-label={`Select ${namespace.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{namespace.name}</TableCell>
                      <TableCell>{getStatusBadge(namespace.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {namespace.age}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Pods: {namespace.resourceQuotas?.pods || 'Unlimited'}</div>
                          <div>Services: {namespace.resourceQuotas?.services || 'Unlimited'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>CPU: {namespace.limits?.cpu || 'Unlimited'}</div>
                          <div>Memory: {namespace.limits?.memory || 'Unlimited'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(namespace.labels || {}).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                          {Object.keys(namespace.labels || {}).length === 0 && (
                            <span className="text-slate-400 text-xs">No labels</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedNamespace(namespace)
                              setShowDetailsDialog(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fetchNamespaceEvents(namespace)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Events
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copyToClipboard(namespace.name)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Name
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Namespace Details: {selectedNamespace?.name}
              </DialogTitle>
              <DialogDescription>
                Detailed information about the namespace configuration
              </DialogDescription>
            </DialogHeader>
            {selectedNamespace && (
              <div className="space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="quotas">Resource Quotas</TabsTrigger>
                    <TabsTrigger value="labels">Labels & Annotations</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Name</label>
                        <p className="text-lg font-semibold">{selectedNamespace.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedNamespace.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Age</label>
                        <p className="text-lg font-semibold">{selectedNamespace.age}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Creation Time</label>
                        <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="quotas" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">Resource Quotas</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Pods:</span>
                            <span className="font-mono">{selectedNamespace.resourceQuotas?.pods || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Services:</span>
                            <span className="font-mono">{selectedNamespace.resourceQuotas?.services || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Secrets:</span>
                            <span className="font-mono">{selectedNamespace.resourceQuotas?.secrets || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ConfigMaps:</span>
                            <span className="font-mono">{selectedNamespace.resourceQuotas?.configMaps || 'Unlimited'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium">Resource Limits</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>CPU Limit:</span>
                            <span className="font-mono">{selectedNamespace.limits?.cpu || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Memory Limit:</span>
                            <span className="font-mono">{selectedNamespace.limits?.memory || 'Unlimited'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="labels" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Labels</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedNamespace.labels || {}).map(([key, value]) => (
                            <Badge key={key} variant="secondary">
                              {key}: {value}
                            </Badge>
                          ))}
                          {Object.keys(selectedNamespace.labels || {}).length === 0 && (
                            <p className="text-slate-500 text-sm">No labels defined</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Annotations</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedNamespace.annotations || {}).map(([key, value]) => (
                            <Badge key={key} variant="outline">
                              {key}: {value}
                            </Badge>
                          ))}
                          {Object.keys(selectedNamespace.annotations || {}).length === 0 && (
                            <p className="text-slate-500 text-sm">No annotations defined</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Events Dialog */}
        <Dialog open={showEventsDialog} onOpenChange={setShowEventsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Namespace Events: {selectedNamespace?.name}
              </DialogTitle>
              <DialogDescription>
                Recent events and activities for this namespace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {namespaceEventsState && namespaceEventsState.length > 0 ? (
                <div className="space-y-3">
                  {namespaceEventsState.map((event: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.type === 'Warning' ? 'destructive' : 'default'}>
                            {event.type}
                          </Badge>
                          <span className="font-medium">{event.reason}</span>
                        </div>
                        <span className="text-sm text-slate-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {event.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No events found for this namespace</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  </ProtectedRoute>
)
}
