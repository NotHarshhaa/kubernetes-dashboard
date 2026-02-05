"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient, Deployment } from "@/lib/api-client"
import { 
  Activity, 
  MoreHorizontal,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Zap
} from "lucide-react"

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getDeployments(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setDeployments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  const getStatusBadge = (deployment: Deployment) => {
    if (deployment.readyReplicas === deployment.replicas) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>
    } else if (deployment.readyReplicas > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />Progressing</Badge>
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Not Ready</Badge>
    }
  }

  const filteredDeployments = deployments.filter(deployment => 
    deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deployment.namespace.toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading deployments...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching deployment information from cluster</p>
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
            <Button onClick={fetchDeployments} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const readyDeployments = deployments.filter(d => d.readyReplicas === d.replicas).length
  const progressingDeployments = deployments.filter(d => d.readyReplicas > 0 && d.readyReplicas < d.replicas).length
  const totalReplicas = deployments.reduce((acc, d) => acc + d.replicas, 0)

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Deployments</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage application deployments and replica sets</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={fetchDeployments}>
                <RefreshCw className="h-4 w-4 mr-2" />
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
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Deployments</CardTitle>
                <Database className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{deployments.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all namespaces</p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Ready</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{readyDeployments}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fully deployed</p>
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
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Progressing</CardTitle>
                <Clock className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{progressingDeployments}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In progress</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Replicas</CardTitle>
                <Zap className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalReplicas}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all deployments</p>
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
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span>Deployment Management</span>
              </CardTitle>
              <CardDescription>
                {filteredDeployments.length} deployments found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search deployments..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <select
                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                >
                  <option value="all">All Namespaces</option>
                  {Array.from(new Set(deployments.map(d => d.namespace))).map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Namespace</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Replicas</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Ready</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Available</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Unavailable</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Images</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white">Age</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeployments.map((deployment, index) => (
                      <motion.tr
                        key={`${deployment.namespace}-${deployment.name}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-white">{deployment.name}</TableCell>
                        <TableCell>{deployment.namespace}</TableCell>
                        <TableCell>{getStatusBadge(deployment)}</TableCell>
                        <TableCell>{deployment.replicas}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{deployment.readyReplicas}</span>
                            <span className="text-slate-400">/</span>
                            <span>{deployment.replicas}</span>
                          </div>
                        </TableCell>
                        <TableCell>{deployment.availableReplicas}</TableCell>
                        <TableCell>
                          {deployment.unavailableReplicas > 0 ? (
                            <span className="text-red-600">{deployment.unavailableReplicas}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {deployment.images.slice(0, 2).map((image, index) => (
                              <div key={index} className="text-sm truncate max-w-[200px]" title={image}>
                                {image}
                              </div>
                            ))}
                            {deployment.images.length > 2 && (
                              <div className="text-xs text-slate-500">
                                +{deployment.images.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deployment.age ? new Date(deployment.age).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Describe</DropdownMenuItem>
                              <DropdownMenuItem>View Events</DropdownMenuItem>
                              <DropdownMenuItem>Scale</DropdownMenuItem>
                              <DropdownMenuItem>Restart</DropdownMenuItem>
                              <DropdownMenuItem>Rollback</DropdownMenuItem>
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
