import { useState, useEffect, useCallback } from 'react'
import { metricsClient } from '@/lib/metrics-client'
import { Node } from '@/lib/api-client'

interface NodeEvent {
  type: string
  reason: string
  message: string
  nodeName: string
  timestamp: string
}

interface NodeMetrics {
  name: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  podCount: number
  status: string
  lastUpdate: string
}

export function useRealTimeNodes() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([])
  const [nodeEvents, setNodeEvents] = useState<NodeEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Skip everything in demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      console.log('Demo mode detected - skipping real-time nodes initialization')
      return
    }

    // Subscribe to node updates
    const unsubscribeNodes = metricsClient.subscribe('nodes', (data) => {
      handleNodeUpdate(data.payload)
    })

    // Subscribe to node events
    const unsubscribeEvents = metricsClient.subscribe('node-events', (data) => {
      handleNodeEvents(data.payload)
    })

    // Subscribe to node metrics
    const unsubscribeMetrics = metricsClient.subscribe('node-metrics', (data) => {
      handleNodeMetrics(data.payload)
    })

    setIsConnected(true)
    fetchInitialData()

    return () => {
      unsubscribeNodes()
      unsubscribeEvents()
      unsubscribeMetrics()
    }
  }, [])

  const handleNodeUpdate = useCallback((payload: any) => {
    setNodes(payload.nodes || [])
    setLastUpdate(new Date())
  }, [])

  const handleNodeEvents = useCallback((payload: any) => {
    setNodeEvents(payload.events || [])
  }, [])

  const handleNodeMetrics = useCallback((payload: any) => {
    setNodeMetrics(payload.metrics || [])
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      // Initial data fetch would go here
      // For now, we'll use mock data
      const mockNodes: Node[] = [
        {
          name: 'node-1',
          status: 'Ready',
          roles: ['control-plane', 'master'],
          version: 'v1.28.0',
          internalIP: '192.168.1.10',
          externalIP: '',
          osImage: 'Ubuntu 22.04 LTS',
          kernelVersion: '5.15.0-88-generic',
          containerRuntime: 'containerd://1.6.18',
          cpuCapacity: '4',
          memoryCapacity: '8Gi',
          podsCapacity: '110',
          allocatableCPU: '4',
          allocatableMemory: '7910Mi'
        },
        {
          name: 'node-2',
          status: 'Ready',
          roles: ['worker'],
          version: 'v1.28.0',
          internalIP: '192.168.1.11',
          externalIP: '',
          osImage: 'Ubuntu 22.04 LTS',
          kernelVersion: '5.15.0-88-generic',
          containerRuntime: 'containerd://1.6.18',
          cpuCapacity: '4',
          memoryCapacity: '8Gi',
          podsCapacity: '110',
          allocatableCPU: '4',
          allocatableMemory: '7910Mi'
        }
      ]

      const mockMetrics: NodeMetrics[] = [
        {
          name: 'node-1',
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          diskUsage: Math.random() * 100,
          podCount: Math.floor(Math.random() * 20) + 5,
          status: 'Ready',
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'node-2',
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          diskUsage: Math.random() * 100,
          podCount: Math.floor(Math.random() * 20) + 5,
          status: 'Ready',
          lastUpdate: new Date().toISOString()
        }
      ]

      const mockEvents: NodeEvent[] = [
        {
          type: 'Normal',
          reason: 'NodeReady',
          message: 'Node node-1 is ready',
          nodeName: 'node-1',
          timestamp: new Date().toISOString()
        }
      ]

      setNodes(mockNodes)
      setNodeMetrics(mockMetrics)
      setNodeEvents(mockEvents)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching initial node data:', error)
    }
  }, [])

  const getNodeMetrics = (nodeName: string) => {
    return nodeMetrics.find(metric => metric.name === nodeName)
  }

  const getNodeEvents = (nodeName: string) => {
    return nodeEvents.filter(event => event.nodeName === nodeName)
  }

  return {
    nodes,
    nodeMetrics,
    nodeEvents,
    isConnected,
    lastUpdate,
    getNodeMetrics,
    getNodeEvents
  }
}
