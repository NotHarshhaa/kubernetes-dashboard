import { useState, useEffect, useCallback } from 'react'
import { metricsClient } from '@/lib/metrics-client'
import { Namespace } from '@/lib/api-client'

interface NamespaceEvent {
  type: string
  reason: string
  message: string
  namespaceName: string
  timestamp: string
}

export function useRealTimeNamespaces() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([])
  const [namespaceEvents, setNamespaceEvents] = useState<NamespaceEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleNamespaceEvents = useCallback((payload: any) => {
    setNamespaceEvents(payload.events || [])
  }, [])

  const handleNamespaceUpdates = useCallback((payload: any) => {
    if (payload.namespaces) {
      setNamespaces(payload.namespaces)
      setLastUpdate(new Date())
    }
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      // Mock data for demo
      const mockNamespaces: Namespace[] = [
        {
          name: 'default',
          status: 'Active',
          age: '30d',
          labels: {},
          annotations: {},
          resourceQuotas: {
            pods: '10',
            services: '5',
            secrets: '10',
            configMaps: '10'
          },
          limits: {
            cpu: '2',
            memory: '4Gi'
          }
        },
        {
          name: 'kube-system',
          status: 'Active',
          age: '30d',
          labels: {},
          annotations: {},
          resourceQuotas: {
            pods: '20',
            services: '10',
            secrets: '20',
            configMaps: '20'
          },
          limits: {
            cpu: '4',
            memory: '8Gi'
          }
        },
        {
          name: 'production',
          status: 'Active',
          age: '15d',
          labels: {
            'environment': 'production',
            'team': 'backend'
          },
          annotations: {},
          resourceQuotas: {
            pods: '50',
            services: '20',
            secrets: '30',
            configMaps: '20'
          },
          limits: {
            cpu: '10',
            memory: '16Gi'
          }
        },
        {
          name: 'staging',
          status: 'Active',
          age: '10d',
          labels: {
            'environment': 'staging',
            'team': 'backend'
          },
          annotations: {},
          resourceQuotas: {
            pods: '30',
            services: '15',
            secrets: '20',
            configMaps: '15'
          },
          limits: {
            cpu: '6',
            memory: '12Gi'
          }
        },
        {
          name: 'development',
          status: 'Active',
          age: '7d',
          labels: {
            'environment': 'development',
            'team': 'frontend'
          },
          annotations: {},
          resourceQuotas: {
            pods: '25',
            services: '10',
            secrets: '15',
            configMaps: '15'
          },
          limits: {
            cpu: '4',
            memory: '8Gi'
          }
        }
      ]

      const mockEvents: NamespaceEvent[] = [
        {
          type: 'Normal',
          reason: 'Created',
          message: 'Namespace production was created',
          namespaceName: 'production',
          timestamp: new Date().toISOString()
        },
        {
          type: 'Normal',
          reason: 'Updated',
          message: 'Resource quotas updated for namespace staging',
          namespaceName: 'staging',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]

      setNamespaces(mockNamespaces)
      setNamespaceEvents(mockEvents)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch initial namespaces data:', error)
    }
  }, [])

  const getNamespaceEvents = useCallback((namespaceName: string) => {
    return namespaceEvents.filter(event => event.namespaceName === namespaceName)
  }, [namespaceEvents])

  useEffect(() => {
    // Skip everything in demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      console.log('Demo mode detected - skipping real-time namespaces initialization')
      return
    }

    // Subscribe to namespace updates
    const unsubscribeNamespaces = metricsClient.subscribe('namespaces', (data) => {
      handleNamespaceUpdates(data.payload)
    })

    // Subscribe to namespace events
    const unsubscribeEvents = metricsClient.subscribe('namespace-events', (data) => {
      handleNamespaceEvents(data.payload)
    })

    setIsConnected(true)
    fetchInitialData()

    return () => {
      unsubscribeNamespaces()
      unsubscribeEvents()
    }
  }, [handleNamespaceEvents, handleNamespaceUpdates, fetchInitialData])

  return {
    namespaces,
    namespaceEvents,
    isConnected,
    lastUpdate,
    getNamespaceEvents
  }
}
