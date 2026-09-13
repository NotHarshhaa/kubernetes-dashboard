"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, Pod } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Terminal as TerminalIcon, 
  RefreshCw, 
  Server, 
  Container,
  Layers,
  Cpu
} from "lucide-react"

// Dynamic import with SSR disabled for xterm canvas DOM requirements
const XtermTerminal = dynamic(
  () => import("@/components/xterm-terminal").then(m => m.XtermTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 font-mono text-sm gap-2">
        <RefreshCw className="size-6 animate-spin text-primary" />
        <span>Initializing xterm.js PTY session...</span>
      </div>
    )
  }
)

export default function TerminalPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPodName, setSelectedPodName] = useState<string>("")
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default")
  const [selectedContainer, setSelectedContainer] = useState<string>("main")
  const { error: showError } = useToast()

  const fetchPods = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPods()
      setPods(data)
      if (data.length > 0 && !selectedPodName) {
        const firstRunning = data.find(p => p.status === 'Running') || data[0]
        setSelectedPodName(firstRunning.name)
        setSelectedNamespace(firstRunning.namespace)
        setSelectedContainer(firstRunning.containers?.[0]?.name || 'main')
      }
    } catch (err) {
      showError(`Failed to fetch pods: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedPodName, showError])

  useEffect(() => {
    fetchPods()
  }, [fetchPods])

  const selectedPod = pods.find(p => p.name === selectedPodName && p.namespace === selectedNamespace)

  const handleExecuteCommand = async (command: string) => {
    const res = await fetch('/api/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('k8s-context') ? { 'x-k8s-context': localStorage.getItem('k8s-context')! } : {})
      },
      body: JSON.stringify({
        podName: selectedPodName,
        namespace: selectedNamespace,
        container: selectedContainer,
        command
      })
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `HTTP ${res.status}`)
    }

    return res.json()
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <TerminalIcon className="size-6 text-primary" />
                Kubernetes Web Terminal
              </h2>
              <p className="text-sm text-muted-foreground">
                High-performance ANSI xterm.js container execution and live shell diagnostics
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPods}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Pods
              </Button>
            </div>
          </div>

          {/* Pod & Target Selector Bar */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Pod Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                      <Server className="size-3.5 text-primary" /> Target Pod:
                    </span>
                    <Select
                      value={selectedPodName}
                      onValueChange={(val) => {
                        setSelectedPodName(val)
                        const p = pods.find(pod => pod.name === val)
                        if (p) {
                          setSelectedNamespace(p.namespace)
                          setSelectedContainer(p.containers?.[0]?.name || 'main')
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[240px] text-xs">
                        <SelectValue placeholder="Select pod" />
                      </SelectTrigger>
                      <SelectContent>
                        {pods.map(pod => (
                          <SelectItem key={`${pod.namespace}-${pod.name}`} value={pod.name}>
                            <span className="font-mono">{pod.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({pod.namespace})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Container Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                      <Container className="size-3.5 text-primary" /> Container:
                    </span>
                    <Select
                      value={selectedContainer}
                      onValueChange={setSelectedContainer}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="Container" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPod?.containers?.map(c => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        )) || (
                          <SelectItem value="main">main</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] gap-1 font-mono">
                    <Layers className="size-3" /> ns: {selectedNamespace}
                  </Badge>
                  {selectedPod && (
                    <Badge variant={selectedPod.status === 'Running' ? 'default' : 'secondary'} className="text-[11px] gap-1">
                      <span className={`size-1.5 rounded-full ${selectedPod.status === 'Running' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {selectedPod.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <XtermTerminal
                key={`${selectedNamespace}-${selectedPodName}-${selectedContainer}`}
                podName={selectedPodName}
                namespace={selectedNamespace}
                container={selectedContainer}
                onExecuteCommand={handleExecuteCommand}
                height="540px"
              />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
