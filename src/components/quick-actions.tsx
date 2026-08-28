"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  Terminal,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  Database,
  Container
} from "lucide-react"
import { useToast } from "@/contexts/toast-context"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  action: () => void
  status?: 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
  disabled?: boolean
}

export function QuickActions() {
  const { success, error: showError, info } = useToast()
  const [actions, setActions] = useState<QuickAction[]>([
    {
      id: 'restart-deployment',
      title: 'Restart Deployment',
      description: 'Restart all pods in a deployment',
      icon: RefreshCw,
      action: () => handleRestartDeployment(),
      status: 'info'
    },
    {
      id: 'scale-deployment',
      title: 'Scale Deployment',
      description: 'Scale deployment up or down',
      icon: Zap,
      action: () => handleScaleDeployment(),
      status: 'success'
    },
    {
      id: 'view-logs',
      title: 'View Logs',
      description: 'Access pod logs in real-time',
      icon: Terminal,
      action: () => handleViewLogs(),
      status: 'info'
    },
    {
      id: 'backup-cluster',
      title: 'Backup Cluster',
      description: 'Create cluster backup snapshot',
      icon: Database,
      action: () => handleBackupCluster(),
      status: 'warning'
    },
    {
      id: 'security-scan',
      title: 'Security Scan',
      description: 'Run security vulnerability scan',
      icon: Shield,
      action: () => handleSecurityScan(),
      status: 'success'
    },
    {
      id: 'cleanup-resources',
      title: 'Cleanup Resources',
      description: 'Remove unused completed resources',
      icon: AlertTriangle,
      action: () => handleCleanupResources(),
      status: 'warning'
    }
  ])

  const handleRestartDeployment = async () => {
    setActions(prev => prev.map(action => 
      action.id === 'restart-deployment' 
        ? { ...action, loading: true }
        : action
    ))

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart-deployment', params: { deployment: 'frontend-app' } })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setActions(prev => prev.map(action => 
          action.id === 'restart-deployment' 
            ? { ...action, loading: false, status: 'success' }
            : action
        ))
        success(result.message)
      } else {
        setActions(prev => prev.map(action => 
          action.id === 'restart-deployment' 
            ? { ...action, loading: false, status: 'error' }
            : action
        ))
        showError(result.message)
      }
    } catch (error) {
      setActions(prev => prev.map(action => 
        action.id === 'restart-deployment' 
          ? { ...action, loading: false, status: 'error' }
          : action
      ))
      showError('Failed to restart deployment')
    }
  }

  const handleScaleDeployment = () => {
    window.location.href = '/workloads'
  }

  const handleViewLogs = () => {
    window.location.href = '/pods'
  }

  const handleBackupCluster = async () => {
    setActions(prev => prev.map(action => 
      action.id === 'backup-cluster' 
        ? { ...action, loading: true }
        : action
    ))

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup-cluster' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setActions(prev => prev.map(action => 
          action.id === 'backup-cluster' 
            ? { ...action, loading: false, status: 'success' }
            : action
        ))
        success(result.message)
      } else {
        setActions(prev => prev.map(action => 
          action.id === 'backup-cluster' 
            ? { ...action, loading: false, status: 'error' }
            : action
        ))
        showError(result.message)
      }
    } catch (error) {
      setActions(prev => prev.map(action => 
        action.id === 'backup-cluster' 
          ? { ...action, loading: false, status: 'error' }
          : action
      ))
      showError('Failed to backup cluster')
    }
  }

  const handleSecurityScan = async () => {
    setActions(prev => prev.map(action => 
      action.id === 'security-scan' 
        ? { ...action, loading: true }
        : action
    ))

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'security-scan' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setActions(prev => prev.map(action => 
          action.id === 'security-scan' 
            ? { ...action, loading: false, status: 'success' }
            : action
        ))
        success(result.message)
      } else {
        setActions(prev => prev.map(action => 
          action.id === 'security-scan' 
            ? { ...action, loading: false, status: 'error' }
            : action
        ))
        showError(result.message)
      }
    } catch (error) {
      setActions(prev => prev.map(action => 
        action.id === 'security-scan' 
          ? { ...action, loading: false, status: 'error' }
          : action
      ))
      showError('Failed to run security scan')
    }
  }

  const handleCleanupResources = async () => {
    setActions(prev => prev.map(action => 
      action.id === 'cleanup-resources' 
        ? { ...action, loading: true }
        : action
    ))

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup-resources' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setActions(prev => prev.map(action => 
          action.id === 'cleanup-resources' 
            ? { ...action, loading: false, status: 'success' }
            : action
        ))
        success(result.message)
      } else {
        setActions(prev => prev.map(action => 
          action.id === 'cleanup-resources' 
            ? { ...action, loading: false, status: 'error' }
            : action
        ))
        showError(result.message)
      }
    } catch (error) {
      setActions(prev => prev.map(action => 
        action.id === 'cleanup-resources' 
          ? { ...action, loading: false, status: 'error' }
          : action
      ))
      showError('Failed to cleanup resources')
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3 text-emerald-500" />
      case 'warning': return <AlertTriangle className="h-3 w-3 text-amber-500" />
      case 'error': return <AlertTriangle className="h-3 w-3 text-destructive" />
      case 'info': return <Container className="h-3 w-3 text-primary" />
      default: return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common cluster management operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Card
                key={action.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={action.action}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2 rounded-md bg-muted text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <h3 className="font-medium text-sm text-foreground">{action.title}</h3>
                        {action.status && (
                          <Badge variant="outline" className="text-xs px-1.5 h-4">
                            {getStatusIcon(action.status)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                      {action.loading && (
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-xs text-muted-foreground">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
