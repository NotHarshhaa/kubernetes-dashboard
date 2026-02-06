// Real-time metrics client for Kubernetes integration

interface MetricValue {
  timestamp: string
  value: number
  labels?: Record<string, string>
}

interface ClusterMetrics {
  cpu: MetricValue[]
  memory: MetricValue[]
  network: MetricValue[]
  pods: MetricValue[]
  nodes: MetricValue[]
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

class MetricsClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()

  constructor(private apiUrl: string) {
    this.connect()
  }

  private connect() {
    try {
      this.ws = new WebSocket(`${this.apiUrl.replace('http', 'ws')}/ws/metrics`)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.attemptReconnect()
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private handleMessage(data: any) {
    const { type, payload } = data
    
    switch (type) {
      case 'metrics':
        this.notifySubscribers('metrics', payload)
        break
      case 'events':
        this.notifySubscribers('events', payload)
        break
      case 'alerts':
        this.notifySubscribers('alerts', payload)
        break
      default:
        console.log('Unknown message type:', type)
    }
  }

  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType)!.add(callback)
    
    return () => {
      this.subscribers.get(eventType)?.delete(callback)
    }
  }

  private notifySubscribers(eventType: string, data: any) {
    const subscribers = this.subscribers.get(eventType)
    if (subscribers) {
      subscribers.forEach(callback => callback(data))
    }
  }

  async fetchMetrics(): Promise<ClusterMetrics> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/metrics`)
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching metrics:', error)
      throw error
    }
  }

  async fetchEvents(): Promise<KubernetesEvent[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/events`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const metricsClient = new MetricsClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
export default MetricsClient
