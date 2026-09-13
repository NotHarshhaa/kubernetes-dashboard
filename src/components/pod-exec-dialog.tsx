"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Terminal, RefreshCw, Container } from "lucide-react"

const XtermTerminal = dynamic(
  () => import("@/components/xterm-terminal").then(m => m.XtermTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 font-mono text-sm gap-2">
        <RefreshCw className="size-6 animate-spin text-primary" />
        <span>Initializing interactive container terminal...</span>
      </div>
    )
  }
)

interface PodExecDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  podName: string
  namespace: string
  containers?: { name: string; image?: string }[]
}

export function PodExecDialog({
  open,
  onOpenChange,
  podName,
  namespace,
  containers = []
}: PodExecDialogProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>(
    containers[0]?.name || 'main'
  )

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name)
    }
  }, [containers, selectedContainer])

  const handleExecuteCommand = async (command: string) => {
    const res = await fetch('/api/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('k8s-context') ? { 'x-k8s-context': localStorage.getItem('k8s-context')! } : {})
      },
      body: JSON.stringify({
        podName,
        namespace,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 border-border/80 shadow-2xl bg-card overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/60 bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Terminal className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Exec: {podName}</span>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    {namespace}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Interactive ANSI container terminal session
                </DialogDescription>
              </div>
            </div>

            {/* Container Selector */}
            {containers.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Container className="size-3.5 text-primary" /> Container:
                </span>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger className="h-7.5 w-[140px] text-xs">
                    <SelectValue placeholder="Container" />
                  </SelectTrigger>
                  <SelectContent>
                    {containers.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-4 bg-background">
          {open && (
            <XtermTerminal
              key={`${namespace}-${podName}-${selectedContainer}`}
              podName={podName}
              namespace={namespace}
              container={selectedContainer}
              onExecuteCommand={handleExecuteCommand}
              height="450px"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
