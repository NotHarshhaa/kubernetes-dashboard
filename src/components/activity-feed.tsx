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
  RefreshCw
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
            <Activity className="h-4 w-4 text-primary" />
            Activity Feed
          </CardTitle>
          <CardDescription>Real-time cluster events and updates</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refreshActivities}
          disabled={isRefreshing}
          className="size-8 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div
                key={activity.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-muted text-foreground shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-xs text-foreground capitalize">
                      {activity.action}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {activity.resource}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {activity.message}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
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
