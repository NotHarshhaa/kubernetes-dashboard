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
  Container,
  ArrowRight
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
  const { success, error: showError } = useToast()
  const [actions, setActions] = useState<QuickAction[]>([
    {
      id: 'restart-deployment',
      title: 'Restart Deployment',
      description: 'Trigger zero-downtime rolling restart',
      icon: RefreshCw,
      action: () => handleRestartDeployment(),
      status: 'info'
    },
    {
      id: 'scale-deployment',
      title: 'Scale Workloads',
      description: 'Scale deployment and statefulset replicas',
      icon: Zap,
      action: () => handleScaleDeployment(),
      status: 'success'
    },
    {
      id: 'view-logs',
      title: 'Stream Logs',
      description: 'Access live pod stdout / stderr logs',
      icon: Terminal,
      action: () => handleViewLogs(),
      status: 'info'
    },
    {
      id: 'backup-cluster',
      title: 'Backup State',
      description: 'Export cluster manifest snapshot',
      icon: Database,
      action: () => handleBackupCluster(),
      status: 'warning'
    },
    {
      id: 'security-scan',
      title: 'Security Audit',
      description: 'Inspect RBAC & container policies',
      icon: Shield,
      action: () => handleSecurityScan(),
      status: 'success'
    },
    {
      id: 'cleanup-resources',
      title: 'Prune Resources',
      description: 'Clean completed jobs & evicted pods',
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          Quick Actions
        </CardTitle>
        <CardDescription>Rapid operational tasks and cluster automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <div
                key={action.id}
                onClick={action.action}
                className="group relative flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/40 hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {action.description}
                  </p>
                  {action.loading && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-[10px] text-muted-foreground">Executing...</span>
                    </div>
                  )}
                </div>
                <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
