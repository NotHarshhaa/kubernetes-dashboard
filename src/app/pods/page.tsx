"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient, Pod } from "@/lib/api-client"
import { 
  Activity, 
  Container, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Zap
} from "lucide-react"

export default function PodsPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchPods = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPods(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setPods(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pods')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchPods()
  }, [fetchPods])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />{status}</Badge>
      case 'failed':
      case 'crashloopbackoff':
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredPods = pods.filter(pod => 
    pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400/20"></div>
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading pods...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching pod information from cluster</p>
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
            <Button onClick={fetchPods} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const runningPods = pods.filter(p => p.status === 'Running').length
  const failedPods = pods.filter(p => ['Failed', 'CrashLoopBackOff', 'Error'].includes(p.status)).length
  const totalRestarts = pods.reduce((acc, pod) => acc + pod.restarts, 0)

  return (
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Pods</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage and monitor your container pods with real-time status</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="lg" onClick={fetchPods} className="rounded-xl">
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Total Pods</CardTitle>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Container className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{pods.length}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Across all namespaces</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Running</CardTitle>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{runningPods}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Healthy pods</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Failed</CardTitle>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{failedPods}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Need attention</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Total Restarts</CardTitle>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                  <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{totalRestarts}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Across all pods</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <Container className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span>Pod Management</span>
              </CardTitle>
              <CardDescription className="text-base">
                {filteredPods.length} pods found across all namespaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search pods by name or namespace..."
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400 transition-all duration-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <select
                  className="px-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white transition-all duration-200"
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                >
                  <option value="all">All Namespaces</option>
                  {Array.from(new Set(pods.map(p => p.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Namespace</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Ready</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Restarts</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Node</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">IP</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Age</TableHead>
                      <TableHead className="w-[50px] py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPods.map((pod, index) => (
                      <motion.tr
                        key={`${pod.namespace}-${pod.name}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-white py-4">{pod.name}</TableCell>
                        <TableCell className="py-4">{pod.namespace}</TableCell>
                        <TableCell className="py-4">{getStatusBadge(pod.status)}</TableCell>
                        <TableCell className="py-4">{pod.ready}</TableCell>
                        <TableCell className="py-4">{pod.restarts}</TableCell>
                        <TableCell className="py-4">{pod.node}</TableCell>
                        <TableCell className="py-4">{pod.ip}</TableCell>
                        <TableCell className="py-4">
                          {pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Logs</DropdownMenuItem>
                              <DropdownMenuItem>Describe</DropdownMenuItem>
                              <DropdownMenuItem>Exec</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
