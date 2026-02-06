import { NextRequest, NextResponse } from 'next/server'
import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node'

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

export async function GET(request: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (isDemoMode) {
    // Return demo data
    const demoNodeResources: NodeResource[] = [
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
      }
    ]
    
    return NextResponse.json(demoNodeResources)
  }

  try {
    // Real Kubernetes API integration
    const kc = new KubeConfig()
    kc.loadFromDefault()
    
    const k8sApi = kc.makeApiClient(CoreV1Api)
    const appsApi = kc.makeApiClient(AppsV1Api)
    
    // Get nodes
    const nodesResponse = await k8sApi.listNode()
    const nodes = nodesResponse.items
    
    // Get pods to count per node
    const podsResponse = await k8sApi.listPodForAllNamespaces()
    const pods = podsResponse.items
    
    const nodeResources: NodeResource[] = []
    
    for (const node of nodes) {
      const nodeName = node.metadata?.name || 'unknown'
      const nodeStatus = getNodeStatus(node)
      
      // Count pods on this node
      const podsOnNode = pods.filter(pod => 
        pod.spec?.nodeName === nodeName
      ).length
      
      // Get node capacity and allocatable resources
      const capacity = node.status?.capacity || {}
      const allocatable = node.status?.allocatable || {}
      
      // Calculate resource usage (simplified - in production you'd use metrics-server)
      const cpuCapacity = parseCpuResource(capacity.cpu || '0')
      const cpuAllocatable = parseCpuResource(allocatable.cpu || '0')
      const memoryCapacity = parseMemoryResource(capacity.memory || '0Ki')
      const memoryAllocatable = parseMemoryResource(allocatable.memory || '0')
      const storageCapacity = parseMemoryResource(capacity['ephemeral-storage'] || '0Ki')
      
      // Estimate current usage (this would come from metrics-server in production)
      const cpuCurrent = cpuCapacity * 0.3 + Math.random() * 0.2 * cpuCapacity // 30-50% usage
      const memoryCurrent = memoryCapacity * 0.4 + Math.random() * 0.2 * memoryCapacity // 40-60% usage
      const storageCurrent = storageCapacity * 0.2 + Math.random() * 0.1 * storageCapacity // 20-30% usage
      
      const maxPods = parseInt(capacity.pods || '110', 10)
      
      nodeResources.push({
        name: nodeName,
        status: nodeStatus,
        cpu: {
          name: 'CPU',
          current: cpuCurrent,
          total: cpuCapacity,
          unit: 'cores',
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          percentage: Math.round((cpuCurrent / cpuCapacity) * 100)
        },
        memory: {
          name: 'Memory',
          current: memoryCurrent,
          total: memoryCapacity,
          unit: 'GB',
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          percentage: Math.round((memoryCurrent / memoryCapacity) * 100)
        },
        storage: {
          name: 'Storage',
          current: storageCurrent,
          total: storageCapacity,
          unit: 'GB',
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          percentage: Math.round((storageCurrent / storageCapacity) * 100)
        },
        pods: podsOnNode,
        maxPods: maxPods
      })
    }
    
    return NextResponse.json(nodeResources)
    
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

function getNodeStatus(node: any): 'Ready' | 'NotReady' | 'Unknown' {
  const conditions = node.status?.conditions || []
  const readyCondition = conditions.find((condition: any) => condition.type === 'Ready')
  
  if (!readyCondition) return 'Unknown'
  return readyCondition.status === 'True' ? 'Ready' : 'NotReady'
}

function parseCpuResource(cpu: string): number {
  // Parse CPU resources like "2000m" or "2"
  if (cpu.endsWith('m')) {
    return parseInt(cpu.slice(0, -1), 10) / 1000
  }
  return parseFloat(cpu) || 0
}

function parseMemoryResource(memory: string): number {
  // Parse memory resources like "16Gi" or "16384Mi" and convert to GB
  if (memory.endsWith('Ki')) {
    return parseInt(memory.slice(0, -2), 10) / (1024 * 1024)
  }
  if (memory.endsWith('Mi')) {
    return parseInt(memory.slice(0, -2), 10) / 1024
  }
  if (memory.endsWith('Gi')) {
    return parseInt(memory.slice(0, -2), 10)
  }
  if (memory.endsWith('k')) {
    return parseInt(memory.slice(0, -1), 10) / (1024 * 1024)
  }
  if (memory.endsWith('M')) {
    return parseInt(memory.slice(0, -1), 10) / 1024
  }
  if (memory.endsWith('G')) {
    return parseInt(memory.slice(0, -1), 10)
  }
  return 0
}
