import { useState, useEffect, useCallback } from 'react'
import { metricsClient } from '@/lib/metrics-client'
import { Service } from '@/lib/api-client'

interface ServiceEvent {
  type: string
  reason: string
  message: string
  serviceName: string
  namespace: string
  timestamp: string
}

interface ServiceMetrics {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIPs: string[]
  ports: number[]
  endpoints: number
  connectionCount: number
  requestRate: number
  lastUpdate: string
}

export function useRealTimeServices() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics[]>([])
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Subscribe to service updates
    const unsubscribeServices = metricsClient.subscribe('services', (data) => {
      handleServiceUpdate(data.payload)
    })

    // Subscribe to service events
    const unsubscribeEvents = metricsClient.subscribe('service-events', (data) => {
      handleServiceEvents(data.payload)
    })

    // Subscribe to service metrics
    const unsubscribeMetrics = metricsClient.subscribe('service-metrics', (data) => {
      handleServiceMetrics(data.payload)
    })

    setIsConnected(true)
    fetchInitialData()

    return () => {
      unsubscribeServices()
      unsubscribeEvents()
      unsubscribeMetrics()
    }
  }, [])

  const handleServiceUpdate = useCallback((payload: any) => {
    setServices(payload.services || [])
    setLastUpdate(new Date())
  }, [])

  const handleServiceEvents = useCallback((payload: any) => {
    setServiceEvents(payload.events || [])
  }, [])

  const handleServiceMetrics = useCallback((payload: any) => {
    setServiceMetrics(payload.metrics || [])
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      // Mock data for demo
      const mockServices: Service[] = [
        {
          name: 'nginx-service',
          namespace: 'default',
          type: 'ClusterIP',
          clusterIP: '10.96.0.1',
          externalIPs: [],
          ports: ['80/TCP'],
          age: '15d',
          selector: 'app=nginx',
          endpoints: ['10.244.0.2:80', '10.244.0.3:80', '10.244.0.4:80']
        },
        {
          name: 'redis-service',
          namespace: 'default',
          type: 'ClusterIP',
          clusterIP: '10.96.0.2',
          externalIPs: [],
          ports: ['6379/TCP'],
          age: '10d',
          selector: 'app=redis',
          endpoints: ['10.244.0.5:6379']
        },
        {
          name: 'app-backend-service',
          namespace: 'production',
          type: 'LoadBalancer',
          clusterIP: '10.96.0.3',
          externalIPs: ['192.168.1.100'],
          ports: ['8080/TCP', '8443/TCP'],
          age: '7d',
          selector: 'app=backend',
          endpoints: ['10.244.1.2:8080', '10.244.1.3:8080', '10.244.1.4:8080', '10.244.1.5:8080']
        },
        {
          name: 'api-gateway',
          namespace: 'production',
          type: 'NodePort',
          clusterIP: '10.96.0.4',
          externalIPs: [],
          ports: ['30000/TCP'],
          age: '5d',
          selector: 'app=gateway',
          endpoints: ['10.244.1.6:30000']
        }
      ]

      const mockMetrics: ServiceMetrics[] = [
        {
          name: 'nginx-service',
          namespace: 'default',
          type: 'ClusterIP',
          clusterIP: '10.96.0.1',
          externalIPs: [],
          ports: [80],
          endpoints: 3,
          connectionCount: Math.floor(Math.random() * 1000) + 100,
          requestRate: Math.floor(Math.random() * 500) + 50,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'redis-service',
          namespace: 'default',
          type: 'ClusterIP',
          clusterIP: '10.96.0.2',
          externalIPs: [],
          ports: [6379],
          endpoints: 1,
          connectionCount: Math.floor(Math.random() * 100) + 10,
          requestRate: Math.floor(Math.random() * 200) + 20,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'app-backend-service',
          namespace: 'production',
          type: 'LoadBalancer',
          clusterIP: '10.96.0.3',
          externalIPs: ['192.168.1.100'],
          ports: [8080, 8443],
          endpoints: 4,
          connectionCount: Math.floor(Math.random() * 5000) + 500,
          requestRate: Math.floor(Math.random() * 2000) + 200,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'api-gateway',
          namespace: 'production',
          type: 'NodePort',
          clusterIP: '10.96.0.4',
          externalIPs: [],
          ports: [30000],
          endpoints: 1,
          connectionCount: Math.floor(Math.random() * 2000) + 200,
          requestRate: Math.floor(Math.random() * 1000) + 100,
          lastUpdate: new Date().toISOString()
        }
      ]

      const mockEvents: ServiceEvent[] = [
        {
          type: 'Normal',
          reason: 'CreatedLoadBalancer',
          message: 'Created load balancer for service app-backend-service',
          serviceName: 'app-backend-service',
          namespace: 'production',
          timestamp: new Date().toISOString()
        },
        {
          type: 'Warning',
          reason: 'ExternalIPNotAvailable',
          message: 'External IP is not available for service nginx-service',
          serviceName: 'nginx-service',
          namespace: 'default',
          timestamp: new Date(Date.now() - 600000).toISOString()
        }
      ]

      setServices(mockServices)
      setServiceMetrics(mockMetrics)
      setServiceEvents(mockEvents)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching initial service data:', error)
    }
  }, [])

  const getServiceMetrics = (serviceName: string, namespace: string) => {
    return serviceMetrics.find(metric => 
      metric.name === serviceName && metric.namespace === namespace
    )
  }

  const getServiceEvents = (serviceName: string, namespace: string) => {
    return serviceEvents.filter(event => 
      event.serviceName === serviceName && event.namespace === namespace
    )
  }

  return {
    services,
    serviceMetrics,
    serviceEvents,
    isConnected,
    lastUpdate,
    getServiceMetrics,
    getServiceEvents
  }
}
