"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from "lucide-react"

interface ResourceMetric {
  name: string
  current: number
  total: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  percentage: number
}

interface NodeResource {
  name: string
  status: 'Ready' | 'NotReady' | 'Unknown'
  cpu: ResourceMetric
  memory: ResourceMetric
  storage: ResourceMetric
  pods: number
  maxPods: number
}

const mockNodeResources: NodeResource[] = [
  {
    name: 'master-node-1',
    status: 'Ready',
    cpu: { name: 'CPU', current: 2.1, total: 4, unit: 'cores', trend: 'up', percentage: 52 },
    memory: { name: 'Memory', current: 6.2, total: 16, unit: 'GB', trend: 'up', percentage: 39 },
    storage: { name: 'Storage', current: 85, total: 500, unit: 'GB', trend: 'stable', percentage: 17 },
    pods: 12,
    maxPods: 110
  },
  {
    name: 'worker-node-1',
    status: 'Ready',
    cpu: { name: 'CPU', current: 3.8, total: 8, unit: 'cores', trend: 'up', percentage: 48 },
    memory: { name: 'Memory', current: 11.4, total: 32, unit: 'GB', trend: 'up', percentage: 36 },
    storage: { name: 'Storage', current: 220, total: 1000, unit: 'GB', trend: 'up', percentage: 22 },
    pods: 28,
    maxPods: 110
  },
  {
    name: 'worker-node-2',
    status: 'Ready',
    cpu: { name: 'CPU', current: 1.9, total: 8, unit: 'cores', trend: 'down', percentage: 24 },
    memory: { name: 'Memory', current: 8.7, total: 32, unit: 'GB', trend: 'down', percentage: 27 },
    storage: { name: 'Storage', current: 156, total: 1000, unit: 'GB', trend: 'stable', percentage: 16 },
    pods: 15,
    maxPods: 110
  },
  {
    name: 'worker-node-3',
    status: 'NotReady',
    cpu: { name: 'CPU', current: 0, total: 8, unit: 'cores', trend: 'stable', percentage: 0 },
    memory: { name: 'Memory', current: 0, total: 32, unit: 'GB', trend: 'stable', percentage: 0 },
    storage: { name: 'Storage', current: 0, total: 1000, unit: 'GB', trend: 'stable', percentage: 0 },
    pods: 0,
    maxPods: 110
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ready': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'NotReady': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'Unknown': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400'
  }
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-red-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
    case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
    case 'stable': return <Minus className="h-3 w-3 text-slate-600" />
  }
}

const getResourceIcon = (resourceType: string) => {
  switch (resourceType) {
    case 'CPU': return <Cpu className="h-4 w-4" />
    case 'Memory': return <MemoryStick className="h-4 w-4" />
    case 'Storage': return <HardDrive className="h-4 w-4" />
    default: return <Network className="h-4 w-4" />
  }
}

export function ResourceCharts() {
  const [nodeResources, setNodeResources] = useState<NodeResource[]>(mockNodeResources)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshResources = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      // Simulate resource updates
      setNodeResources(prev => prev.map(node => ({
        ...node,
        cpu: {
          ...node.cpu,
          current: Math.max(0, node.cpu.current + (Math.random() - 0.5) * 0.5),
          percentage: Math.min(100, Math.max(0, node.cpu.percentage + (Math.random() - 0.5) * 5)),
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
        },
        memory: {
          ...node.memory,
          current: Math.max(0, node.memory.current + (Math.random() - 0.5) * 1),
          percentage: Math.min(100, Math.max(0, node.memory.percentage + (Math.random() - 0.5) * 3)),
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
        }
      })))
      setIsRefreshing(false)
    }, 1000)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshResources()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const totalCPU = nodeResources.reduce((sum, node) => sum + node.cpu.current, 0)
  const totalMemory = nodeResources.reduce((sum, node) => sum + node.memory.current, 0)
  const totalStorage = nodeResources.reduce((sum, node) => sum + node.storage.current, 0)
  const totalPods = nodeResources.reduce((sum, node) => sum + node.pods, 0)

  return (
    <div className="space-y-6">
      {/* Cluster Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              Cluster Resources
            </CardTitle>
            <CardDescription>Overall resource utilization across the cluster</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshResources}
            disabled={isRefreshing}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{totalCPU.toFixed(1)}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">CPU Cores</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MemoryStick className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{totalMemory.toFixed(1)}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Memory GB</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{totalStorage}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Storage GB</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Network className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{totalPods}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Pods</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nodeResources.map((node) => (
          <Card key={node.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{node.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(node.status)}>
                      {node.status}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {node.pods}/{node.maxPods} pods
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { metric: node.cpu, icon: <Cpu className="h-4 w-4" /> },
                { metric: node.memory, icon: <MemoryStick className="h-4 w-4" /> },
                { metric: node.storage, icon: <HardDrive className="h-4 w-4" /> }
              ].map(({ metric, icon }) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {metric.current.toFixed(1)}/{metric.total} {metric.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metric.trend)}
                      <span className="text-sm font-medium">{metric.percentage}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={metric.percentage} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
