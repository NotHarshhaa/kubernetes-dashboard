import { useState, useEffect, useCallback } from 'react'
import { metricsClient } from '@/lib/metrics-client'
import { Deployment } from '@/lib/api-client'

interface DeploymentEvent {
  type: string
  reason: string
  message: string
  deploymentName: string
  namespace: string
  timestamp: string
}

interface DeploymentMetrics {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  availableReplicas: number
  unavailableReplicas: number
  cpuUsage: number
  memoryUsage: number
  lastUpdate: string
}

export function useRealTimeDeployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [deploymentMetrics, setDeploymentMetrics] = useState<DeploymentMetrics[]>([])
  const [deploymentEvents, setDeploymentEvents] = useState<DeploymentEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Subscribe to deployment updates
    const unsubscribeDeployments = metricsClient.subscribe('deployments', (data) => {
      handleDeploymentUpdate(data.payload)
    })

    // Subscribe to deployment events
    const unsubscribeEvents = metricsClient.subscribe('deployment-events', (data) => {
      handleDeploymentEvents(data.payload)
    })

    // Subscribe to deployment metrics
    const unsubscribeMetrics = metricsClient.subscribe('deployment-metrics', (data) => {
      handleDeploymentMetrics(data.payload)
    })

    setIsConnected(true)
    fetchInitialData()

    return () => {
      unsubscribeDeployments()
      unsubscribeEvents()
      unsubscribeMetrics()
    }
  }, [])

  const handleDeploymentUpdate = useCallback((payload: any) => {
    setDeployments(payload.deployments || [])
    setLastUpdate(new Date())
  }, [])

  const handleDeploymentEvents = useCallback((payload: any) => {
    setDeploymentEvents(payload.events || [])
  }, [])

  const handleDeploymentMetrics = useCallback((payload: any) => {
    setDeploymentMetrics(payload.metrics || [])
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      // Mock data for demo
      const mockDeployments: Deployment[] = [
        {
          name: 'nginx-deployment',
          namespace: 'default',
          replicas: 3,
          readyReplicas: 3,
          upToDateReplicas: 3,
          availableReplicas: 3,
          age: '15d',
          status: 'Running',
          images: ['nginx:1.21'],
          selector: 'app=nginx'
        },
        {
          name: 'redis-deployment',
          namespace: 'default',
          replicas: 1,
          readyReplicas: 1,
          upToDateReplicas: 1,
          availableReplicas: 1,
          age: '10d',
          status: 'Running',
          images: ['redis:7-alpine'],
          selector: 'app=redis'
        },
        {
          name: 'app-backend',
          namespace: 'production',
          replicas: 5,
          readyReplicas: 4,
          upToDateReplicas: 5,
          availableReplicas: 4,
          age: '7d',
          status: 'Progressing',
          images: ['myapp/backend:v2.1'],
          selector: 'app=backend'
        }
      ]

      const mockMetrics: DeploymentMetrics[] = [
        {
          name: 'nginx-deployment',
          namespace: 'default',
          replicas: 3,
          readyReplicas: 3,
          availableReplicas: 3,
          unavailableReplicas: 0,
          cpuUsage: Math.random() * 50,
          memoryUsage: Math.random() * 80,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'redis-deployment',
          namespace: 'default',
          replicas: 1,
          readyReplicas: 1,
          availableReplicas: 1,
          unavailableReplicas: 0,
          cpuUsage: Math.random() * 30,
          memoryUsage: Math.random() * 60,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'app-backend',
          namespace: 'production',
          replicas: 5,
          readyReplicas: 4,
          availableReplicas: 4,
          unavailableReplicas: 1,
          cpuUsage: Math.random() * 80,
          memoryUsage: Math.random() * 90,
          lastUpdate: new Date().toISOString()
        }
      ]

      const mockEvents: DeploymentEvent[] = [
        {
          type: 'Normal',
          reason: 'ScalingReplicaSet',
          message: 'Scaled up replica set app-backend-7d5f8b9c9f to 5',
          deploymentName: 'app-backend',
          namespace: 'production',
          timestamp: new Date().toISOString()
        },
        {
          type: 'Warning',
          reason: 'FailedCreate',
          message: 'Error creating: pod "app-backend-7d5f8b9c9f-xyz12" is invalid: spec.containers[0].imagePullPolicy[0]: Invalid value: "Always": may not be set to "Always" for image "myapp/backend:v2.1"',
          deploymentName: 'app-backend',
          namespace: 'production',
          timestamp: new Date(Date.now() - 300000).toISOString()
        }
      ]

      setDeployments(mockDeployments)
      setDeploymentMetrics(mockMetrics)
      setDeploymentEvents(mockEvents)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching initial deployment data:', error)
    }
  }, [])

  const getDeploymentMetrics = (deploymentName: string, namespace: string) => {
    return deploymentMetrics.find(metric => 
      metric.name === deploymentName && metric.namespace === namespace
    )
  }

  const getDeploymentEvents = (deploymentName: string, namespace: string) => {
    return deploymentEvents.filter(event => 
      event.deploymentName === deploymentName && event.namespace === namespace
    )
  }

  return {
    deployments,
    deploymentMetrics,
    deploymentEvents,
    isConnected,
    lastUpdate,
    getDeploymentMetrics,
    getDeploymentEvents
  }
}
