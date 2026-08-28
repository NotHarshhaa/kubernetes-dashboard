"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/contexts/toast-context"
import { Terminal, RefreshCw, Download, Search, Copy, Check, Filter } from "lucide-react"
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
      <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-6 rounded-2xl bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <Terminal className="h-5 w-5 text-emerald-400" />
                <span>Pod Logs:</span>
                <span className="font-mono text-emerald-400">{podName}</span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm flex items-center gap-3">
                <span>Namespace: <strong className="text-slate-300">{namespace}</strong></span>
                <span>•</span>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs">
                  Live Stream
                </Badge>
              </DialogDescription>
            </div>

            {/* Container Selector */}
            {containers.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Container:</span>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger className="h-9 w-44 bg-slate-900 border-slate-700 text-slate-200 text-xs">
                    <SelectValue placeholder="Select container" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    {containers.map(c => (
                      <SelectItem key={c.name} value={c.name} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Filter logs (e.g. error, warn, GET)..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="h-8 pl-9 pr-3 text-xs bg-slate-900/90 border-slate-700 text-slate-200 rounded-lg placeholder:text-slate-500 focus-visible:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`h-8 px-3 text-xs border-slate-700 rounded-lg ${
                  autoRefresh ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${autoRefresh || loading ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Streaming' : 'Follow Logs'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700 rounded-lg"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 px-3 text-xs bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700 rounded-lg"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Log Viewer Content */}
        <div className="flex-1 min-h-[380px] max-h-[55vh] mt-4 rounded-xl border border-slate-800/80 bg-black/70 p-4 font-mono text-xs overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 w-full h-full pr-3" ref={scrollRef}>
            {filteredLogs.trim() ? (
              <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed select-text font-mono">
                {filteredLogs}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                <Terminal className="h-8 w-8 text-slate-600 animate-pulse" />
                <p>{filterQuery ? 'No log lines match your filter expression.' : 'Waiting for log output from container...'}</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <strong className="text-slate-200">{filteredLogs.split('\n').filter(Boolean).length}</strong> lines
            {filterQuery && ` (filtered from ${logs.split('\n').filter(Boolean).length} total)`}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
