"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Upload, 
  Terminal,
  Settings,
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
      description: 'Remove unused resources',
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
        body: JSON.stringify({ action: 'restart-deployment' })
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
    info('Opening scale deployment dialog...')
  }

  const handleViewLogs = async () => {
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view-logs' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        info('Opening logs viewer...')
        // In a real implementation, you'd navigate to a logs page
        console.log('Logs data:', result.data)
      } else {
        showError(result.message)
      }
    } catch (error) {
      showError('Failed to retrieve logs')
    }
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3" />
      case 'warning': return <AlertTriangle className="h-3 w-3" />
      case 'error': return <AlertTriangle className="h-3 w-3" />
      case 'info': return <Container className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common cluster management operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{action.title}</h3>
                          {action.status && (
                            <Badge className={getStatusColor(action.status)}>
                              {getStatusIcon(action.status)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          {action.description}
                        </p>
                        {action.loading && (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">Processing...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                Quick Actions Tips
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <li>• Actions are performed on the selected namespace</li>
                <li>• Some operations may require additional permissions</li>
                <li>• Always review changes before applying to production</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
