import { useState, useEffect, useCallback, useRef } from 'react'
import { metricsClient } from '@/lib/metrics-client'

interface MetricData {
  time: string
  value: number
  label: string
}

interface RealTimeMetrics {
  cpu: MetricData[]
  memory: MetricData[]
  network: MetricData[]
  pods: MetricData[]
  nodes: MetricData[]
}

interface KubernetesEvent {
  type: string
  reason: string
  message: string
  source: {
    component: string
    host: string
  }
  involvedObject: {
    kind: string
    name: string
    namespace?: string
  }
  lastTimestamp: string
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  details?: string[]
}

export function useRealTimeMetrics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    cpu: [],
    memory: [],
    network: [],
    pods: [],
    nodes: []
  })
  const [events, setEvents] = useState<KubernetesEvent[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const subscribersRef = useRef<Map<string, Function>>(new Map())

  // Initialize real-time connection
  useEffect(() => {
    // Skip everything in demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      console.log('Demo mode detected - skipping real-time metrics initialization')
      return
    }

    // Subscribe to metrics updates
    const unsubscribeMetrics = metricsClient.subscribe('metrics', (data) => {
      handleMetricsUpdate(data.payload)
    })

    // Subscribe to event updates
    const unsubscribeEvents = metricsClient.subscribe('events', (data) => {
      handleEventsUpdate(data.payload)
    })

    // Subscribe to alert updates
    const unsubscribeAlerts = metricsClient.subscribe('alerts', (data) => {
      handleAlertsUpdate(data.payload)
    })

    // Set connection status
    setIsConnected(true)

    // Initial data fetch
    fetchInitialData()

    // Cleanup
    return () => {
      unsubscribeMetrics()
      unsubscribeEvents()
      unsubscribeAlerts()
    }
  }, [])

  const handleMetricsUpdate = useCallback((payload: any) => {
    const timestamp = new Date(payload.timestamp)
    setLastUpdate(timestamp)

    setMetrics(prev => {
      const newMetrics = { ...prev }
      
      // Update each metric type with new data point
      Object.keys(payload.metrics).forEach((key: string) => {
        const metricKey = key as keyof RealTimeMetrics
        const value = payload.metrics[key as keyof typeof payload.metrics]
        
        if (metricKey in newMetrics) {
          const newDataPoint: MetricData = {
            time: timestamp.toLocaleTimeString(),
            value: typeof value === 'number' ? value : 0,
            label: metricKey
          }
          
          // Keep only last 24 data points
          newMetrics[metricKey] = [...newMetrics[metricKey], newDataPoint].slice(-24)
        }
      })
      
      return newMetrics
    })
  }, [])

  const handleEventsUpdate = useCallback((payload: any) => {
    setEvents(payload.events)
  }, [])

  const handleAlertsUpdate = useCallback((payload: Alert[]) => {
    setAlerts(payload)
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      const initialMetrics = await metricsClient.fetchMetrics()
      
      // Convert to MetricData format
      const formattedMetrics: RealTimeMetrics = {
        cpu: [{
          time: new Date().toLocaleTimeString(),
          value: typeof initialMetrics.cpu === 'number' ? initialMetrics.cpu : 0,
          label: 'cpu'
        }],
        memory: [{
          time: new Date().toLocaleTimeString(),
          value: typeof initialMetrics.memory === 'number' ? initialMetrics.memory : 0,
          label: 'memory'
        }],
        network: [{
          time: new Date().toLocaleTimeString(),
          value: typeof initialMetrics.network === 'number' ? initialMetrics.network : 0,
          label: 'network'
        }],
        pods: [{
          time: new Date().toLocaleTimeString(),
          value: typeof initialMetrics.pods === 'number' ? initialMetrics.pods : 0,
          label: 'pods'
        }],
        nodes: [{
          time: new Date().toLocaleTimeString(),
          value: typeof initialMetrics.nodes === 'number' ? initialMetrics.nodes : 0,
          label: 'nodes'
        }]
      }
      
      setMetrics(formattedMetrics)
      
      const initialEvents = await metricsClient.fetchEvents()
      setEvents(initialEvents)
      
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }, [])

  const subscribe = useCallback((eventType: string, callback: Function) => {
    const id = Date.now().toString()
    subscribersRef.current.set(id, callback)
    
    return () => {
      subscribersRef.current.delete(id)
    }
  }, [])

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  const dismissAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const getLatestMetric = useCallback((type: keyof RealTimeMetrics) => {
    const metricData = metrics[type]
    return metricData.length > 0 ? metricData[metricData.length - 1] : null
  }, [metrics])

  const getMetricTrend = useCallback((type: keyof RealTimeMetrics) => {
    const metricData = metrics[type]
    if (metricData.length < 2) return 'stable'
    
    const latest = metricData[metricData.length - 1].value
    const previous = metricData[metricData.length - 2].value
    
    if (latest > previous * 1.05) return 'up'
    if (latest < previous * 0.95) return 'down'
    return 'stable'
  }, [metrics])

  return {
    metrics,
    events,
    alerts,
    isConnected,
    lastUpdate,
    subscribe,
    dismissAlert,
    dismissAllAlerts,
    getLatestMetric,
    getMetricTrend
  }
}
