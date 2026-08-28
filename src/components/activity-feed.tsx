"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  Container, 
  Network, 
  Database, 
  Server, 
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle2
} from "lucide-react"

interface ActivityItem {
  id: string
  type: 'pod' | 'service' | 'deployment' | 'node' | 'alert'
  action: 'created' | 'updated' | 'deleted' | 'scaled' | 'error' | 'success'
  resource: string
  namespace: string
  timestamp: Date | string
  message: string
  severity?: 'low' | 'medium' | 'high'
}

const getIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'pod': return Container
    case 'service': return Network
    case 'deployment': return Database
    case 'node': return Server
    case 'alert': return AlertTriangle
    default: return Activity
  }
}

const getActionBadge = (action: ActivityItem['action']) => {
  switch (action) {
    case 'created':
    case 'success':
      return <Badge variant="success" className="text-[10px] h-4.5 px-1.5 capitalize">{action}</Badge>
    case 'deleted':
    case 'error':
      return <Badge variant="destructive" className="text-[10px] h-4.5 px-1.5 capitalize">{action}</Badge>
    case 'scaled':
    case 'updated':
      return <Badge variant="info" className="text-[10px] h-4.5 px-1.5 capitalize">{action}</Badge>
    default:
      return <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 capitalize">{action}</Badge>
  }
}

const formatTimeAgo = (timestamp: Date | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshActivities = async () => {
    setIsRefreshing(true)
    await fetchActivities()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-emerald-500" />
            Activity Stream
          </CardTitle>
          <CardDescription>Real-time cluster audit log and lifecycle events</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refreshActivities}
          disabled={isRefreshing}
          className="size-8 shrink-0 rounded-lg"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-muted text-foreground shrink-0 mt-0.5 border border-border/50">
                  <Icon className="size-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getActionBadge(activity.action)}
                    <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-mono text-muted-foreground">
                      {activity.namespace}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground font-mono truncate">
                    {activity.resource}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    {activity.message}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground font-mono">
                  <Clock className="size-3" />
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
