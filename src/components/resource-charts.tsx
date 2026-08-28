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
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Server,
  Activity
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

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="size-3 text-emerald-500" />
    case 'down': return <TrendingDown className="size-3 text-rose-500" />
    case 'stable': return <Minus className="size-3 text-muted-foreground" />
  }
}

export function ResourceCharts() {
  const [nodeResources, setNodeResources] = useState<NodeResource[]>(mockNodeResources)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string>('all')

  const refreshData = async () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setNodeResources(prev => prev.map(node => ({
        ...node,
        cpu: {
          ...node.cpu,
          percentage: Math.min(100, Math.max(10, node.cpu.percentage + (Math.random() * 20 - 10)))
        },
        memory: {
          ...node.memory,
          percentage: Math.min(100, Math.max(10, node.memory.percentage + (Math.random() * 15 - 7.5)))
        }
      })))
      setIsRefreshing(false)
    }, 600)
  }

  const filteredNodes = selectedNode === 'all' 
    ? nodeResources 
    : nodeResources.filter(node => node.name === selectedNode)

  const avgCpu = Math.round(nodeResources.reduce((acc, node) => acc + node.cpu.percentage, 0) / nodeResources.length)
  const avgMemory = Math.round(nodeResources.reduce((acc, node) => acc + node.memory.percentage, 0) / nodeResources.length)
  const avgStorage = Math.round(nodeResources.reduce((acc, node) => acc + node.storage.percentage, 0) / nodeResources.length)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="size-4 text-sky-500" />
            Cluster Resource Allocation
          </CardTitle>
          <CardDescription>Live compute, memory, and disk telemetry across active nodes</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedNode} 
            onChange={(e) => setSelectedNode(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-input bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Nodes</option>
            {nodeResources.map(node => (
              <option key={node.name} value={node.name}>{node.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
            className="size-8 rounded-lg"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aggregated cluster averages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/30">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Cpu className="size-3.5 text-primary" /> CPU Capacity
              </span>
              <span className="font-bold text-foreground font-mono">{avgCpu}%</span>
            </div>
            <Progress value={avgCpu} className="h-2" indicatorClassName={avgCpu > 80 ? "bg-rose-500" : "bg-primary"} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <MemoryStick className="size-3.5 text-sky-500" /> Memory Pool
              </span>
              <span className="font-bold text-foreground font-mono">{avgMemory}%</span>
            </div>
            <Progress value={avgMemory} className="h-2" indicatorClassName={avgMemory > 80 ? "bg-amber-500" : "bg-sky-500"} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <HardDrive className="size-3.5 text-violet-500" /> Storage Volume
              </span>
              <span className="font-bold text-foreground font-mono">{avgStorage}%</span>
            </div>
            <Progress value={avgStorage} className="h-2" indicatorClassName="bg-violet-500" />
          </div>
        </div>

        {/* Node detail items */}
        <div className="space-y-2.5">
          {filteredNodes.map((node) => (
            <div 
              key={node.name}
              className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/30 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground font-mono">{node.name}</span>
                  <Badge 
                    variant={node.status === 'Ready' ? 'success' : 'destructive'} 
                    className="text-[10px] h-4.5 px-2"
                  >
                    {node.status}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {node.pods}/{node.maxPods} Pods
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      CPU {getTrendIcon(node.cpu.trend)}
                    </span>
                    <span className="font-mono text-foreground font-semibold">{Math.round(node.cpu.percentage)}%</span>
                  </div>
                  <Progress value={node.cpu.percentage} className="h-1.5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Memory {getTrendIcon(node.memory.trend)}
                    </span>
                    <span className="font-mono text-foreground font-semibold">{Math.round(node.memory.percentage)}%</span>
                  </div>
                  <Progress value={node.memory.percentage} className="h-1.5" indicatorClassName="bg-sky-500" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Disk {getTrendIcon(node.storage.trend)}
                    </span>
                    <span className="font-mono text-foreground font-semibold">{Math.round(node.storage.percentage)}%</span>
                  </div>
                  <Progress value={node.storage.percentage} className="h-1.5" indicatorClassName="bg-violet-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
