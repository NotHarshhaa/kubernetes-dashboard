"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'pod',
    action: 'created',
    resource: 'nginx-deployment-7d5c8b9f9-abc123',
    namespace: 'default',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    message: 'Pod started successfully',
    severity: 'low'
  },
  {
    id: '2',
    type: 'deployment',
    action: 'scaled',
    resource: 'frontend-app',
    namespace: 'production',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    message: 'Scaled from 3 to 5 replicas',
    severity: 'medium'
  },
  {
    id: '3',
    type: 'service',
    action: 'updated',
    resource: 'api-service',
    namespace: 'default',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    message: 'Service type changed to LoadBalancer',
    severity: 'low'
  },
  {
    id: '4',
    type: 'node',
    action: 'error',
    resource: 'worker-node-3',
    namespace: 'kube-system',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    message: 'Node memory usage critical (92%)',
    severity: 'high'
  },
  {
    id: '5',
    type: 'pod',
    action: 'deleted',
    resource: 'old-job-processor',
    namespace: 'jobs',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    message: 'Pod terminated after job completion',
    severity: 'low'
  }
]

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

const getActionColor = (action: ActivityItem['action']) => {
  switch (action) {
    case 'created': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
    case 'updated': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
    case 'deleted': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
    case 'scaled': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20'
    case 'error': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
    case 'success': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
    default: return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-900/20'
  }
}

const getSeverityColor = (severity?: ActivityItem['severity']) => {
  switch (severity) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    default: return 'bg-slate-500'
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

  const addNewActivity = () => {
    const types: ActivityItem['type'][] = ['pod', 'service', 'deployment', 'node', 'alert']
    const actions: ActivityItem['action'][] = ['created', 'updated', 'deleted', 'scaled', 'error', 'success']
    const severities: ActivityItem['severity'][] = ['low', 'medium', 'high']
    
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: types[Math.floor(Math.random() * types.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      resource: `resource-${Math.random().toString(36).substr(2, 9)}`,
      namespace: ['default', 'production', 'staging', 'kube-system'][Math.floor(Math.random() * 4)],
      timestamp: new Date(),
      message: 'New activity detected',
      severity: severities[Math.floor(Math.random() * severities.length)]
    }
    
    setActivities(prev => [newActivity, ...prev].slice(0, 10))
  }

  const refreshActivities = async () => {
    setIsRefreshing(true)
    await fetchActivities()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchActivities()
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        fetchActivities()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Activity Feed
          </CardTitle>
          <CardDescription>Real-time cluster events and updates</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshActivities}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {activities.map((activity, index) => {
              const Icon = getIcon(activity.type)
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {activity.severity && (
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(activity.severity)}`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900 dark:text-white">
                        {activity.action}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {activity.resource}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {activity.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
