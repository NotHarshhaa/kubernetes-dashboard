"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient, Service } from "@/lib/api-client"
import { 
  Activity, 
  Network, 
  MoreHorizontal,
  RefreshCw,
  Search,
  ExternalLink,
  Globe,
  Lock,
  AlertTriangle
} from "lucide-react"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getServices(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clusterip':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"><Lock className="w-3 h-3 mr-1" />{type}</Badge>
      case 'nodeport':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"><Network className="w-3 h-3 mr-1" />{type}</Badge>
      case 'loadbalancer':
        return <Badge variant="outline" className="border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20"><Globe className="w-3 h-3 mr-1" />{type}</Badge>
      case 'externalname':
        return <Badge variant="outline" className="border-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-900/20"><ExternalLink className="w-3 h-3 mr-1" />{type}</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.namespace.toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading services...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching service information from cluster</p>
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
            <Button onClick={fetchServices} className="bg-blue-600 hover:bg-blue-700">
              Retry Connection
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const clusterIPServices = services.filter(s => s.type === 'ClusterIP').length
  const loadBalancerServices = services.filter(s => s.type === 'LoadBalancer').length
  const externalServices = services.filter(s => s.externalIPs.length > 0).length

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Services</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Monitor and manage your network services with real-time connectivity</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="lg" onClick={fetchServices} className="rounded-xl">
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
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">Total Services</CardTitle>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{services.length}</div>
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
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">ClusterIP</CardTitle>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{clusterIPServices}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Internal services</p>
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
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">LoadBalancer</CardTitle>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{loadBalancerServices}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">External services</p>
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
                <CardTitle className="text-base font-semibold text-slate-600 dark:text-slate-400">External IPs</CardTitle>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                  <ExternalLink className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{externalServices}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Publicly accessible</p>
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
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                  <Network className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Service Management</span>
              </CardTitle>
              <CardDescription className="text-base">
                {filteredServices.length} services found across all namespaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search services by name or namespace..."
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
                  {Array.from(new Set(services.map(s => s.namespace))).map(ns => (
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
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Type</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Cluster IP</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">External IPs</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Ports</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4">Age</TableHead>
                      <TableHead className="w-[50px] py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service, index) => (
                      <motion.tr
                        key={`${service.namespace}-${service.name}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-white py-4">{service.name}</TableCell>
                        <TableCell className="py-4">{service.namespace}</TableCell>
                        <TableCell className="py-4">{getTypeBadge(service.type)}</TableCell>
                        <TableCell className="py-4">{service.clusterIP}</TableCell>
                        <TableCell className="py-4">
                          {service.externalIPs.length > 0 ? (
                            <div className="space-y-1">
                              {service.externalIPs.map((ip, index) => (
                                <div key={index} className="text-sm text-green-600 font-medium">{ip}</div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            {service.ports.split(', ').map((port, index) => (
                              <div key={index} className="text-sm">{port}</div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {service.age ? new Date(service.age).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Describe</DropdownMenuItem>
                              <DropdownMenuItem>View Endpoints</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
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
