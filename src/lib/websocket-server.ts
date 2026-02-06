// WebSocket server for real-time Kubernetes metrics and events

import { Server } from 'socket.io'
import { createServer } from 'http'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ClusterMetrics {
  cpu: number
  memory: number
  network: number
  pods: number
  nodes: number
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

class WebSocketServer {
  private io: Server
  private metricsInterval: NodeJS.Timeout | null = null
  private eventsInterval: NodeJS.Timeout | null = null

  constructor(port: number) {
    const httpServer = createServer()
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    httpServer.listen(port, () => {
      console.log(`WebSocket server running on port ${port}`)
    })

    this.setupEventHandlers()
    this.startMetricsCollection()
    this.startEventCollection()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected to WebSocket')
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from WebSocket')
      })

      socket.on('subscribe', (data) => {
        socket.join(data.eventType)
        console.log(`Client subscribed to ${data.eventType}`)
      })

      socket.on('unsubscribe', (data) => {
        socket.leave(data.eventType)
        console.log(`Client unsubscribed from ${data.eventType}`)
      })
    })
  }

  private async getKubernetesMetrics(): Promise<ClusterMetrics> {
    try {
      // Get CPU metrics
      const cpuCmd = 'kubectl top nodes --no-headers | awk \'{sum+=$2} END {print sum}\''
      const cpuResult = await execAsync(cpuCmd)
      const cpuUsage = parseFloat(cpuResult.stdout.trim()) || 0

      // Get memory metrics
      const memoryCmd = 'kubectl top nodes --no-headers | awk \'{sum+=$3} END {print sum}\''
      const memoryResult = await execAsync(memoryCmd)
      const memoryUsage = parseFloat(memoryResult.stdout.trim()) || 0

      // Get pod count
      const podCmd = 'kubectl get pods --no-headers | wc -l'
      const podResult = await execAsync(podCmd)
      const podCount = parseInt(podResult.stdout.trim()) || 0

      // Get node count
      const nodeCmd = 'kubectl get nodes --no-headers | wc -l'
      const nodeResult = await execAsync(nodeCmd)
      const nodeCount = parseInt(nodeResult.stdout.trim()) || 0

      // Get network metrics (simplified)
      const networkUsage = Math.random() * 1000 // This would need proper network monitoring

      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        network: networkUsage,
        pods: podCount,
        nodes: nodeCount
      }
    } catch (error) {
      console.error('Error fetching Kubernetes metrics:', error)
      return {
        cpu: 0,
        memory: 0,
        network: 0,
        pods: 0,
        nodes: 0
      }
    }
  }

  private async getKubernetesEvents(): Promise<KubernetesEvent[]> {
    try {
      const cmd = 'kubectl get events --sort-by=.metadata.creationTimestamp --no-headers -o custom-columns=TYPE,REASON,OBJECT,MESSAGE --field-selector=type!=Normal'
      const result = await execAsync(cmd)
      
      const events: KubernetesEvent[] = []
      const lines = result.stdout.trim().split('\n')
      
      for (const line of lines) {
        const parts = line.split(/\s+/)
        if (parts.length >= 4) {
          events.push({
            type: parts[0],
            reason: parts[1],
            message: parts.slice(3).join(' '),
            source: {
              component: 'kubelet',
              host: 'localhost'
            },
            involvedObject: {
              kind: 'Pod',
              name: parts[2],
              namespace: 'default'
            },
            lastTimestamp: new Date().toISOString()
          })
        }
      }
      
      return events
    } catch (error) {
      console.error('Error fetching Kubernetes events:', error)
      return []
    }
  }

  private generateAlerts(metrics: ClusterMetrics, events: KubernetesEvent[]) {
    const alerts = []

    // CPU usage alert
    if (metrics.cpu > 80) {
      alerts.push({
        id: `cpu-high-${Date.now()}`,
        type: 'warning',
        title: 'High CPU Usage',
        message: `Cluster CPU usage is ${metrics.cpu.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        details: [`Current: ${metrics.cpu.toFixed(1)}%`, `Threshold: 80%`]
      })
    }

    // Memory usage alert
    if (metrics.memory > 80) {
      alerts.push({
        id: `memory-high-${Date.now()}`,
        type: 'warning',
        title: 'High Memory Usage',
        message: `Cluster memory usage is ${metrics.memory.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        details: [`Current: ${metrics.memory.toFixed(1)}%`, `Threshold: 80%`]
      })
    }

    // Node alerts from events
    const nodeEvents = events.filter(e => e.reason.includes('Node') || e.reason.includes('NotReady'))
    nodeEvents.forEach(event => {
      alerts.push({
        id: `node-event-${Date.now()}-${Math.random()}`,
        type: 'error',
        title: 'Node Issue Detected',
        message: event.message,
        timestamp: event.lastTimestamp,
        details: [event.reason, event.involvedObject.name]
      })
    })

    return alerts
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getKubernetesMetrics()
        
        // Broadcast metrics to all subscribed clients
        this.io.emit('metrics', {
          type: 'metrics',
          payload: {
            timestamp: new Date().toISOString(),
            metrics
          }
        })

        // Generate and broadcast alerts
        const events = await this.getKubernetesEvents()
        const alerts = this.generateAlerts(metrics, events)
        
        if (alerts.length > 0) {
          this.io.emit('alerts', {
            type: 'alerts',
            payload: alerts
          })
        }
      } catch (error) {
        console.error('Error in metrics collection:', error)
      }
    }, 5000) // Collect metrics every 5 seconds
  }

  private startEventCollection() {
    this.eventsInterval = setInterval(async () => {
      try {
        const events = await this.getKubernetesEvents()
        
        // Broadcast events to all subscribed clients
        this.io.emit('events', {
          type: 'events',
          payload: {
            timestamp: new Date().toISOString(),
            events
          }
        })
      } catch (error) {
        console.error('Error in event collection:', error)
      }
    }, 10000) // Collect events every 10 seconds
  }

  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    if (this.eventsInterval) {
      clearInterval(this.eventsInterval)
    }
    this.io.close()
  }
}

export default WebSocketServer
