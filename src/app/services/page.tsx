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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient, Service } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { useRealTimeServices } from "@/hooks/use-real-time-services"
import { 
  Activity, 
  Network, 
  MoreHorizontal,
  RefreshCw,
  Search,
  ExternalLink,
  Globe,
  Lock,
  AlertTriangle,
  Trash2,
  Eye,
  Download,
  Server,
  Copy,
  Target,
  Shield,
  Info
} from "lucide-react"

export default function ServicesPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Use real-time services hook or demo fallback based on environment
  const realTimeData = useRealTimeServices()
  const { 
    services, 
    serviceMetrics, 
    serviceEvents, 
    isConnected, 
    lastUpdate, 
    getServiceMetrics, 
    getServiceEvents 
  } = isDemoMode ? {
    services: [
      {
        name: 'nginx-service',
        namespace: 'default',
        type: 'ClusterIP',
        clusterIP: '10.96.0.1',
        externalIPs: [],
        ports: '80/TCP',
        age: '15d'
      },
      {
        name: 'redis-service',
        namespace: 'default',
        type: 'ClusterIP',
        clusterIP: '10.96.0.2',
        externalIPs: [],
        ports: '6379/TCP',
        age: '10d'
      },
      {
        name: 'app-backend-service',
        namespace: 'production',
        type: 'LoadBalancer',
        clusterIP: '10.96.0.3',
        externalIPs: ['192.168.1.100'],
        ports: '8080/TCP,8443/TCP',
        age: '7d'
      },
      {
        name: 'database-service',
        namespace: 'production',
        type: 'ClusterIP',
        clusterIP: '10.96.0.4',
        externalIPs: [],
        ports: '5432/TCP',
        age: '12d'
      }
    ],
    serviceMetrics: [],
    serviceEvents: [],
    isConnected: false,
    lastUpdate: null,
    getServiceMetrics: (name: string, namespace: string) => ({
      type: 'ClusterIP',
      clusterIP: '10.96.0.1',
      externalIPs: [],
      ports: [80],
      endpoints: Math.floor(Math.random() * 5) + 1,
      connectionCount: Math.floor(Math.random() * 1000) + 100,
      requestRate: Math.floor(Math.random() * 500) + 50,
      lastUpdate: new Date().toISOString()
    }),
    getServiceEvents: (name: string, namespace: string) => [{
      type: 'Normal',
      reason: 'CreatedService',
      message: `Created service ${name}`,
      serviceName: name,
      namespace: namespace,
      timestamp: new Date().toISOString()
    }]
  } : realTimeData

  // Demo mode - fallback to original implementation with real-time features
  const [servicesState, setServicesState] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceEndpoints, setServiceEndpoints] = useState<any>(null)
  const [serviceDetails, setServiceDetails] = useState<any>(null)
  const [showEndpointsDialog, setShowEndpointsDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const { success, error: showError, info } = useToast()

  // Demo mode connection status
  const [demoLastUpdate, setDemoLastUpdate] = useState<Date | null>(null)

  // Use appropriate data source based on mode
  const currentServices = isDemoMode ? servicesState : services
  const currentLastUpdate = isDemoMode ? demoLastUpdate : lastUpdate
  const currentIsConnected = isDemoMode ? false : isConnected

  // Mock functions for demo mode
  const demoGetServiceMetrics = (serviceName: string, namespace: string) => {
    return {
      type: 'ClusterIP',
      clusterIP: '10.96.0.1',
      externalIPs: [],
      ports: [80],
      endpoints: Math.floor(Math.random() * 5) + 1,
      connectionCount: Math.floor(Math.random() * 1000) + 100,
      requestRate: Math.floor(Math.random() * 500) + 50,
      lastUpdate: new Date().toISOString()
    }
  }

  const demoGetServiceEvents = (serviceName: string, namespace: string) => {
    return [
      {
        type: 'Normal',
        reason: 'CreatedService',
        message: `Created service ${serviceName}`,
        serviceName: serviceName,
        namespace: namespace,
        timestamp: new Date().toISOString()
      }
    ]
  }

  // Use appropriate functions based on mode
  const currentGetServiceMetrics = isDemoMode ? demoGetServiceMetrics : getServiceMetrics
  const currentGetServiceEvents = isDemoMode ? demoGetServiceEvents : getServiceEvents

  const fetchServices = useCallback(async () => {
    if (isDemoMode) return // Skip fetch in demo mode - use mock data instead
    
    try {
      setLoading(true)
      const data = await apiClient.getServices(
        selectedNamespace === "all" ? undefined : selectedNamespace
      )
      setServicesState(data)
      setDemoLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, isDemoMode])

  const fetchServiceEndpoints = async (service: Service) => {
    try {
      // Mock endpoints data
      const mockEndpoints = {
        service: service.name,
        namespace: service.namespace,
        endpoints: [
          {
            ip: "10.244.0.10",
            hostname: "pod-1",
            ready: true,
            ports: [
              { port: 80, targetPort: 8080, protocol: "TCP" },
              { port: 443, targetPort: 8443, protocol: "TCP" }
            ]
          },
          {
            ip: "10.244.0.11",
            hostname: "pod-2",
            ready: true,
            ports: [
              { port: 80, targetPort: 8080, protocol: "TCP" },
              { port: 443, targetPort: 8443, protocol: "TCP" }
            ]
          },
          {
            ip: "10.244.0.12",
            hostname: "pod-3",
            ready: false,
            ports: [
              { port: 80, targetPort: 8080, protocol: "TCP" },
              { port: 443, targetPort: 8443, protocol: "TCP" }
            ]
          }
        ]
      }
      
      setServiceEndpoints(mockEndpoints)
      setSelectedService(service)
      setShowEndpointsDialog(true)
    } catch (error) {
      showError('Failed to fetch service endpoints')
    }
  }

  const fetchServiceDetails = async (service: Service) => {
    try {
      // Mock detailed service information
      const details = {
        ...service,
        selector: {
          app: service.name,
          tier: "backend"
        },
        sessionAffinity: "None",
        sessionAffinityConfig: {
          clientIP: {
            timeoutSeconds: 10800
          }
        },
        publishNotReadyAddresses: false,
        internalTrafficPolicy: "Cluster",
        externalTrafficPolicy: "Local",
        healthCheckNodePort: 32456,
        ports: service.ports.split(', ').map((port: string) => {
          const [portNum, protocol = "TCP"] = port.split('/')
          return {
            name: `${service.name}-${portNum}`,
            protocol: protocol,
            port: parseInt(portNum),
            targetPort: parseInt(portNum) + 1000
          }
        }),
        conditions: [
          { type: 'Ready', status: 'True', lastProbeTime: new Date().toISOString() },
          { type: 'EndpointsFound', status: 'True', lastProbeTime: new Date().toISOString() }
        ],
        events: [
          { type: 'Normal', reason: 'Created', message: `Service ${service.name} created` },
          { type: 'Normal', reason: 'UpdatedLoadBalancer', message: 'Updated load balancer with new external IP' },
          { type: 'Normal', reason: 'EndpointsFound', message: 'Found matching endpoints for service' }
        ]
      }
      
      setServiceDetails(details)
      setSelectedService(service)
      setShowDetailsDialog(true)
    } catch (error) {
      showError('Failed to fetch service details')
    }
  }

  const deleteService = async (service: Service) => {
    try {
      success(`Service ${service.name} deleted successfully`)
      fetchServices()
    } catch (error) {
      showError(`Failed to delete service ${service.name}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
  }

  const exportServiceData = () => {
    const csvContent = [
      ['Name', 'Namespace', 'Type', 'Cluster IP', 'External IPs', 'Ports', 'Age'],
      ...filteredServices.map(service => [
        service.name,
        service.namespace,
        service.type,
        service.clusterIP,
        service.externalIPs.join('; ') || '-',
        service.ports,
        service.age ? new Date(service.age).toLocaleDateString() : '-'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `services-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    success('Service data exported successfully')
  }

  const bulkDeleteServices = async () => {
    try {
      if (selectedServices.size === 0) {
        info('No services selected for deletion')
        return
      }
      
      success(`${selectedServices.size} services deleted successfully`)
      setSelectedServices(new Set())
      fetchServices()
    } catch (error) {
      showError('Failed to delete selected services')
    }
  }

  const toggleServiceSelection = (serviceKey: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceKey)) {
        newSet.delete(serviceKey)
      } else {
        newSet.add(serviceKey)
      }
      return newSet
    })
  }

  const selectAllServices = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set())
    } else {
      setSelectedServices(new Set(filteredServices.map(service => `${service.namespace}-${service.name}`)))
    }
  }

  useEffect(() => {
    if (!isDemoMode) {
      fetchServices()
    } else {
      // Initialize demo data
      setDemoLastUpdate(new Date())
      setLoading(false)
    }
  }, [fetchServices, isDemoMode])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh && !isDemoMode) {
      interval = setInterval(fetchServices, 10000) // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchServices, isDemoMode])

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

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || service.type.toLowerCase() === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

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
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Demo Mode</span>
                    </>
                  ) : currentIsConnected ? (
                    <>
                      <Network className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <Network className="h-4 w-4" />
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
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`rounded-xl ${autoRefresh ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh'}
              </Button>
              <Button variant="outline" size="lg" onClick={exportServiceData} className="rounded-xl">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4 flex-1">
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
                  <select
                    className="px-4 py-3 border border-slate-200/50 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white transition-all duration-200"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="clusterip">ClusterIP</option>
                    <option value="nodeport">NodePort</option>
                    <option value="loadbalancer">LoadBalancer</option>
                    <option value="externalname">ExternalName</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedServices.size > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        <span className="text-sm font-medium">
                          {selectedServices.size} {selectedServices.size === 1 ? 'service' : 'services'} selected
                        </span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={bulkDeleteServices}
                        className="rounded-lg bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white py-4 w-12">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
                            onCheckedChange={selectAllServices}
                          />
                        </div>
                      </TableHead>
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
                    {filteredServices.map((service, index) => {
                      const serviceKey = `${service.namespace}-${service.name}`
                      const isSelected = selectedServices.has(serviceKey)
                      
                      return (
                        <motion.tr
                          key={serviceKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleServiceSelection(serviceKey)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white py-4">{service.name}</TableCell>
                          <TableCell className="py-4">{service.namespace}</TableCell>
                          <TableCell className="py-4">{getTypeBadge(service.type)}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{service.clusterIP}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(service.clusterIP)}
                                className="h-6 w-6 p-0 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {service.externalIPs.length > 0 ? (
                              <div className="space-y-1">
                                {service.externalIPs.map((ip, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-sm text-green-600 font-medium">{ip}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(ip)}
                                      className="h-6 w-6 p-0 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
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
                                <DropdownMenuItem onClick={() => fetchServiceDetails(service)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fetchServiceEndpoints(service)}>
                                  <Target className="h-4 w-4 mr-2" />
                                  View Endpoints
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyToClipboard(service.clusterIP)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Cluster IP
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteService(service)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Endpoints Dialog */}
      <Dialog open={showEndpointsDialog} onOpenChange={setShowEndpointsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Service Endpoints: {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              Namespace: {selectedService?.namespace} | Type: {selectedService?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {serviceEndpoints?.endpoints?.map((endpoint: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${endpoint.ready ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <div className="font-medium">{endpoint.hostname}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">{endpoint.ip}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {endpoint.ports.map((port: any, portIndex: number) => (
                                <span key={portIndex} className="mr-2">
                                  {port.port}:{port.targetPort}/{port.protocol}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge className={endpoint.ready ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {endpoint.ready ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowEndpointsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Service Details: {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              Namespace: {selectedService?.namespace} | Type: {selectedService?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ports">Ports</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Basic Info
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {selectedService?.name}</div>
                      <div><strong>Namespace:</strong> {selectedService?.namespace}</div>
                      <div><strong>Type:</strong> {selectedService?.type}</div>
                      <div><strong>Cluster IP:</strong> {selectedService?.clusterIP}</div>
                      <div><strong>Created:</strong> {selectedService?.age ? new Date(selectedService.age).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Configuration
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Session Affinity:</strong> {serviceDetails?.sessionAffinity}</div>
                      <div><strong>Internal Traffic Policy:</strong> {serviceDetails?.internalTrafficPolicy}</div>
                      <div><strong>External Traffic Policy:</strong> {serviceDetails?.externalTrafficPolicy}</div>
                      <div><strong>Health Check Node Port:</strong> {serviceDetails?.healthCheckNodePort}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Selector
                  </h4>
                  <div className="flex gap-2">
                    {Object.entries(serviceDetails?.selector || {}).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}={String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ports" className="space-y-4">
                {serviceDetails?.ports?.map((port: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{port.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Port: {port.port} → Target Port: {port.targetPort}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Protocol: {port.protocol}
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {port.protocol}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                {serviceDetails?.conditions?.map((condition: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{condition.type}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Last checked: {new Date(condition.lastProbeTime).toLocaleString()}
                          </div>
                        </div>
                        <Badge className={condition.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {condition.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="events" className="space-y-4">
                {serviceDetails?.events?.map((event: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{event.reason}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{event.message}</div>
                        </div>
                        <Badge className={event.type === 'Normal' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                          {event.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
