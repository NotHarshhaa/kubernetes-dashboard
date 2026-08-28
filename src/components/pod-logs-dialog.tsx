"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/contexts/toast-context"
import { Terminal, RefreshCw, Download, Search, Copy, Check } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface PodLogsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  podName: string
  namespace: string
  containers?: { name: string; image?: string }[]
}

export function PodLogsDialog({
  open,
  onOpenChange,
  podName,
  namespace,
  containers = []
}: PodLogsDialogProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>(
    containers[0]?.name || ''
  )
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name)
    }
  }, [containers, selectedContainer])

  const fetchLogs = useCallback(async () => {
    if (!podName || !namespace) return
    try {
      setLoading(true)
      const text = await apiClient.getPodLogs(namespace, podName, selectedContainer)
      setLogs(text)
    } catch (err) {
      showError(`Failed to fetch logs: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [podName, namespace, selectedContainer, showError])

  useEffect(() => {
    if (open) {
      fetchLogs()
    }
  }, [open, fetchLogs])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (open && autoRefresh) {
      interval = setInterval(fetchLogs, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [open, autoRefresh, fetchLogs])

  const handleCopy = () => {
    navigator.clipboard.writeText(logs)
    setCopied(true)
    success('Logs copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${namespace}-${podName}-${selectedContainer || 'main'}.log`
    a.click()
    URL.revokeObjectURL(url)
    success('Log file downloaded')
  }

  const filteredLogs = logs
    .split('\n')
    .filter(line => (filterQuery ? line.toLowerCase().includes(filterQuery.toLowerCase()) : true))
    .join('\n')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-5">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="size-4.5 text-primary" />
                <span>Live Pod Logs:</span>
                <span className="font-mono text-primary">{podName}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Namespace: <strong className="text-foreground font-mono">{namespace}</strong></span>
                <span>•</span>
                <Badge variant="success" className="text-[10px] h-4.5 px-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Live Stream
                </Badge>
              </DialogDescription>
            </div>

            {containers.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Container:</span>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger className="h-8.5 w-36 text-xs">
                    <SelectValue placeholder="Select container" />
                  </SelectTrigger>
                  <SelectContent>
                    {containers.map(c => (
                      <SelectItem key={c.name} value={c.name} className="text-xs font-mono">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter output log lines..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="h-8 pl-8 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-8 px-2.5 text-xs shadow-xs"
              >
                <RefreshCw className={`size-3.5 mr-1.5 ${autoRefresh || loading ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Streaming' : 'Follow'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2.5 text-xs shadow-xs"
              >
                {copied ? <Check className="size-3.5 mr-1 text-emerald-500" /> : <Copy className="size-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 px-2.5 text-xs shadow-xs"
              >
                <Download className="size-3.5 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[350px] max-h-[50vh] mt-2 rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-hidden flex flex-col shadow-inner">
          <ScrollArea className="flex-1 w-full h-full pr-2" ref={scrollRef}>
            {filteredLogs.trim() ? (
              <pre className="text-zinc-200 whitespace-pre-wrap break-all leading-relaxed select-text font-mono">
                {filteredLogs}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 gap-2">
                <Terminal className="size-6 animate-pulse text-zinc-400" />
                <p className="text-xs">{filterQuery ? 'No log lines match filter.' : 'Waiting for live stdout/stderr log output...'}</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <div>
            Showing <strong className="text-foreground font-mono">{filteredLogs.split('\n').filter(Boolean).length}</strong> log lines
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-7.5"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
