import { NextRequest, NextResponse } from 'next/server'
import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node'

interface ActivityItem {
  id: string
  type: 'pod' | 'service' | 'deployment' | 'node' | 'alert'
  action: 'created' | 'updated' | 'deleted' | 'scaled' | 'error' | 'success'
  resource: string
  namespace: string
  timestamp: string // JSON serializable
  message: string
  severity?: 'low' | 'medium' | 'high'
}

export async function GET(request: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (isDemoMode) {
    // Return demo data
    const demoActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'pod',
        action: 'created',
        resource: 'nginx-deployment-7d5c8b9f9-abc123',
        namespace: 'default',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        message: 'Pod started successfully',
        severity: 'low'
      },
      {
        id: '2',
        type: 'deployment',
        action: 'scaled',
        resource: 'frontend-app',
        namespace: 'production',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        message: 'Scaled from 3 to 5 replicas',
        severity: 'medium'
      },
      {
        id: '3',
        type: 'service',
        action: 'updated',
        resource: 'api-service',
        namespace: 'default',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        message: 'Service type changed to LoadBalancer',
        severity: 'low'
      },
      {
        id: '4',
        type: 'node',
        action: 'error',
        resource: 'worker-node-3',
        namespace: 'kube-system',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        message: 'Node memory usage critical (92%)',
        severity: 'high'
      },
      {
        id: '5',
        type: 'pod',
        action: 'deleted',
        resource: 'old-job-processor',
        namespace: 'jobs',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        message: 'Pod terminated after job completion',
        severity: 'low'
      }
    ]
    
    return NextResponse.json(demoActivities)
  }

  try {
    // Real Kubernetes API integration
    const kc = new KubeConfig()
    kc.loadFromDefault()
    
    const k8sApi = kc.makeApiClient(CoreV1Api)
    const appsApi = kc.makeApiClient(AppsV1Api)
    
    const activities: ActivityItem[] = []
    
    // Get recent events from all namespaces
    const events = await k8sApi.listEventForAllNamespaces()
    
    events.items.forEach((event: any, index: number) => {
      if (event.metadata?.name && event.involvedObject && event.lastTimestamp) {
        activities.push({
          id: event.metadata.name,
          type: mapResourceType(event.involvedObject.kind),
          action: mapEventType(event.type, event.reason),
          resource: event.involvedObject.name,
          namespace: event.metadata.namespace || 'default',
          timestamp: new Date(event.lastTimestamp).toISOString(),
          message: event.message || `${event.reason} for ${event.involvedObject.name}`,
          severity: mapSeverity(event.type)
        })
      }
    })
    
    // Sort by timestamp (newest first) and limit to 20
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return NextResponse.json(activities.slice(0, 20))
    
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

function mapResourceType(kind?: string): ActivityItem['type'] {
  switch (kind?.toLowerCase()) {
    case 'pod': return 'pod'
    case 'service': return 'service'
    case 'deployment': return 'deployment'
    case 'daemonset':
    case 'statefulset':
    case 'replicaset': return 'deployment'
    case 'node': return 'node'
    default: return 'alert'
  }
}

function mapEventType(type?: string, reason?: string): ActivityItem['action'] {
  if (type === 'Normal') {
    switch (reason?.toLowerCase()) {
      case 'created': return 'created'
      case 'updated': return 'updated'
      case 'deleted': return 'deleted'
      case 'scaled': return 'scaled'
      case 'started':
      case 'pulled': return 'success'
      default: return 'updated'
    }
  } else {
    return 'error'
  }
}

function mapSeverity(type?: string): ActivityItem['severity'] {
  return type === 'Warning' || type === 'Error' ? 'high' : 'low'
}
