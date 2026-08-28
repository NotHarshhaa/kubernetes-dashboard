"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, Ingress, Service, Deployment, Pod, Node } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  GitFork, 
  Globe, 
  Network, 
  Database, 
  Container, 
  Server, 
  Search, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react"

interface TopologyNode {
  id: string
  kind: 'Ingress' | 'Service' | 'Deployment' | 'Pod' | 'Node'
  name: string
  namespace: string
  status: 'healthy' | 'warning' | 'error'
  detail: string
  targetIds: string[]
}

export default function TopologyPage() {
  const [nodes, setNodes] = useState<TopologyNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null)

  const { error: showError } = useToast()

  const fetchTopologyData = useCallback(async () => {
    try {
      setLoading(true)
      const [ingresses, services, deployments, pods, clusterNodes] = await Promise.all([
        apiClient.getIngresses(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getServices(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getDeployments(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getPods(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getNodes()
      ])

      const topologyNodes: TopologyNode[] = []

      // 1. Ingresses
      ingresses.forEach(ing => {
        const targetServices = ing.paths.map(p => `svc-${ing.namespace}-${p.backend}`)
        topologyNodes.push({
          id: `ing-${ing.namespace}-${ing.name}`,
          kind: 'Ingress',
          name: ing.name,
          namespace: ing.namespace,
          status: 'healthy',
          detail: `Hosts: ${ing.hosts.join(', ')}`,
          targetIds: targetServices
        })
      })

      // 2. Services
      services.forEach(svc => {
        const targetDeps = deployments
          .filter(d => d.namespace === svc.namespace && (d.name === svc.name || svc.name.startsWith(d.name)))
          .map(d => `dep-${d.namespace}-${d.name}`)

        topologyNodes.push({
          id: `svc-${svc.namespace}-${svc.name}`,
          kind: 'Service',
          name: svc.name,
          namespace: svc.namespace,
          status: 'healthy',
          detail: `Type: ${svc.type} • Ports: ${svc.ports}`,
          targetIds: targetDeps
        })
      })

      // 3. Deployments
      deployments.forEach(dep => {
        const targetPods = pods
          .filter(p => p.namespace === dep.namespace && p.name.startsWith(dep.name))
          .map(p => `pod-${p.namespace}-${p.name}`)

        const isHealthy = dep.readyReplicas === dep.replicas

        topologyNodes.push({
          id: `dep-${dep.namespace}-${dep.name}`,
          kind: 'Deployment',
          name: dep.name,
          namespace: dep.namespace,
          status: isHealthy ? 'healthy' : 'warning',
          detail: `Replicas: ${dep.readyReplicas}/${dep.replicas} • Image: ${dep.images[0] || '-'}`,
          targetIds: targetPods
        })
      })

      // 4. Pods
      pods.forEach(pod => {
        const targetNode = clusterNodes.find(n => n.name === pod.node)
        const targetIds = targetNode ? [`node-${targetNode.name}`] : []

        topologyNodes.push({
          id: `pod-${pod.namespace}-${pod.name}`,
          kind: 'Pod',
          name: pod.name,
          namespace: pod.namespace,
          status: pod.status === 'Running' ? 'healthy' : 'error',
          detail: `Status: ${pod.status} • Node: ${pod.node} • IP: ${pod.ip}`,
          targetIds
        })
      })

      // 5. Nodes
      clusterNodes.forEach(node => {
        topologyNodes.push({
          id: `node-${node.name}`,
          kind: 'Node',
          name: node.name,
          namespace: 'infrastructure',
          status: node.status === 'Ready' ? 'healthy' : 'error',
          detail: `CPU: ${node.cpuCapacity}c • Memory: ${node.memoryCapacity} • OS: ${node.osImage}`,
          targetIds: []
        })
      })

      setNodes(topologyNodes)
      if (topologyNodes.length > 0 && !selectedNode) {
        setSelectedNode(topologyNodes[0])
      }
    } catch (err) {
      showError(`Failed to build topology: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, showError, selectedNode])

  useEffect(() => {
    fetchTopologyData()
  }, [fetchTopologyData])

  const getNodeIcon = (kind: TopologyNode['kind']) => {
    switch (kind) {
      case 'Ingress': return Globe
      case 'Service': return Network
      case 'Deployment': return Database
      case 'Pod': return Container
      case 'Node': return Server
    }
  }

  const getStatusColor = (status: TopologyNode['status']) => {
    switch (status) {
      case 'healthy': return 'border-emerald-500/60 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
      case 'warning': return 'border-amber-500/60 bg-amber-500/5 text-amber-600 dark:text-amber-400'
      case 'error': return 'border-rose-500/60 bg-rose-500/5 text-rose-600 dark:text-rose-400'
    }
  }

  // Filter columns
  const ingresses = nodes.filter(n => n.kind === 'Ingress' && (searchTerm ? n.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
  const services = nodes.filter(n => n.kind === 'Service' && (searchTerm ? n.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
  const deployments = nodes.filter(n => n.kind === 'Deployment' && (searchTerm ? n.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
  const pods = nodes.filter(n => n.kind === 'Pod' && (searchTerm ? n.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
  const clusterNodes = nodes.filter(n => n.kind === 'Node' && (searchTerm ? n.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))

  const namespaces = Array.from(new Set(nodes.filter(n => n.kind !== 'Node').map(n => n.namespace)))

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <GitFork className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Architecture Topology Map
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    Live visual dependency graph from Ingress routing gateways to Services, Workload Pods, and Compute Nodes
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={fetchTopologyData}>
                <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search & Namespace Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search topology nodes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-8.5"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedNamespace}
                onChange={e => setSelectedNamespace(e.target.value)}
                className="h-8.5 px-3 rounded-lg text-xs border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
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

          {/* Main Visual Topology Flow Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 p-4 rounded-xl border border-border/80 bg-muted/20 overflow-x-auto min-h-[550px]">
              <div className="grid grid-cols-5 gap-4 min-w-[900px]">
                {/* 1. Ingress Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
                    <Globe className="size-3.5 text-sky-500" />
                    Ingress ({ingresses.length})
                  </div>
                  <div className="space-y-2.5">
                    {ingresses.map(node => {
                      const isSelected = selectedNode?.id === node.id
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                            isSelected ? 'ring-2 ring-primary border-primary bg-card' : 'bg-card/70 hover:bg-card border-border/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="size-3.5 text-sky-500" />
                            <span className="font-mono text-xs font-bold truncate">{node.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono mt-1.5">{node.namespace}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Services Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
                    <Network className="size-3.5 text-violet-500" />
                    Services ({services.length})
                  </div>
                  <div className="space-y-2.5">
                    {services.map(node => {
                      const isSelected = selectedNode?.id === node.id
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                            isSelected ? 'ring-2 ring-primary border-primary bg-card' : 'bg-card/70 hover:bg-card border-border/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Network className="size-3.5 text-violet-500" />
                            <span className="font-mono text-xs font-bold truncate">{node.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono mt-1.5">{node.namespace}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Deployments Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
                    <Database className="size-3.5 text-primary" />
                    Workloads ({deployments.length})
                  </div>
                  <div className="space-y-2.5">
                    {deployments.map(node => {
                      const isSelected = selectedNode?.id === node.id
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                            isSelected ? 'ring-2 ring-primary border-primary bg-card' : 'bg-card/70 hover:bg-card border-border/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Database className="size-3.5 text-primary" />
                            <span className="font-mono text-xs font-bold truncate">{node.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono mt-1.5">{node.namespace}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Pods Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
                    <Container className="size-3.5 text-emerald-500" />
                    Pods ({pods.length})
                  </div>
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {pods.map(node => {
                      const isSelected = selectedNode?.id === node.id
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                            isSelected ? 'ring-2 ring-primary border-primary bg-card' : 'bg-card/70 hover:bg-card border-border/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Container className="size-3 text-emerald-500" />
                            <span className="font-mono text-[11px] font-bold truncate">{node.name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 5. Nodes Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
                    <Server className="size-3.5 text-sky-500" />
                    Nodes ({clusterNodes.length})
                  </div>
                  <div className="space-y-2.5">
                    {clusterNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                            isSelected ? 'ring-2 ring-primary border-primary bg-card' : 'bg-card/70 hover:bg-card border-border/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Server className="size-3.5 text-sky-500" />
                            <span className="font-mono text-xs font-bold truncate">{node.name}</span>
                          </div>
                          <Badge variant="success" className="text-[10px] mt-1.5">Ready</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Node Details Inspector */}
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="size-4 text-primary" />
                  Resource Inspector
                </CardTitle>
                <CardDescription>Click any node on canvas to view runtime topology context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {selectedNode ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resource Kind</span>
                        <Badge variant="purple" className="text-[10px] font-mono">{selectedNode.kind}</Badge>
                      </div>
                      <div className="font-mono text-xs font-bold text-foreground break-all">{selectedNode.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Namespace: {selectedNode.namespace}</div>
                    </div>

                    <div className="p-3 bg-card border border-border/60 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telemetry & Spec:</span>
                      <p className="font-mono text-xs text-foreground leading-relaxed break-all">{selectedNode.detail}</p>
                    </div>

                    {selectedNode.targetIds.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Connected Downstream ({selectedNode.targetIds.length}):
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedNode.targetIds.map(tid => (
                            <div key={tid} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/40 text-[11px] font-mono truncate">
                              <ArrowRight className="size-3 text-primary shrink-0" />
                              <span className="truncate">{tid}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs text-center">
                    <GitFork className="size-8 text-muted-foreground/50 mb-2 animate-pulse" />
                    Select a resource in the topology view to inspect
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
