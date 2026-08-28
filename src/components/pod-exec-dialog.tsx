"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/contexts/toast-context"
import { Terminal, Send, Trash2, Sparkles, Server } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface PodExecDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  podName: string
  namespace: string
  containers?: { name: string; image?: string }[]
}

interface TerminalLine {
  type: 'command' | 'output' | 'system'
  text: string
  timestamp: string
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
  const [inputCommand, setInputCommand] = useState("")
  const [history, setHistory] = useState<TerminalLine[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [executing, setExecuting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { error: showError } = useToast()

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name)
    }
  }, [containers, selectedContainer])

  useEffect(() => {
    if (open) {
      setHistory([
        {
          type: 'system',
          text: `Connected to interactive container session [${selectedContainer || 'main'}] in pod ${podName} (${namespace})\nType 'help' to see quick diagnostic commands.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ])
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, podName, namespace, selectedContainer])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const runCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun !== undefined ? cmdToRun : inputCommand).trim()
    if (!cmd) return

    const now = new Date().toLocaleTimeString()

    // Add command to history
    setHistory(prev => [...prev, { type: 'command', text: cmd, timestamp: now }])
    setCommandHistory(prev => [cmd, ...prev.filter(c => c !== cmd)])
    setHistoryIndex(-1)
    setInputCommand("")

    if (cmd.toLowerCase() === 'clear') {
      setHistory([])
      return
    }

    try {
      setExecuting(true)
      const res = await apiClient.execCommand(podName, namespace, selectedContainer, cmd)
      if (res.output === '__CLEAR__') {
        setHistory([])
      } else {
        setHistory(prev => [...prev, { type: 'output', text: res.output, timestamp: now }])
      }
    } catch (err) {
      showError(`Command execution failed: ${err instanceof Error ? err.message : 'Error'}`)
      setHistory(prev => [...prev, { type: 'output', text: `Error: Command execution failed`, timestamp: now }])
    } finally {
      setExecuting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1)
        setHistoryIndex(nextIdx)
        setInputCommand(commandHistory[nextIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1
        setHistoryIndex(nextIdx)
        setInputCommand(commandHistory[nextIdx])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInputCommand("")
      }
    }
  }

  const presets = [
    { label: "ps aux", cmd: "ps aux" },
    { label: "top", cmd: "top" },
    { label: "df -h", cmd: "df -h" },
    { label: "env", cmd: "env" },
    { label: "netstat", cmd: "netstat -tlpn" },
    { label: "os-info", cmd: "cat /etc/os-release" },
    { label: "curl :8080", cmd: "curl localhost:8080/healthz" }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-5">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="size-4.5 text-emerald-500" />
                <span>Interactive Container Shell:</span>
                <span className="font-mono text-primary">{podName}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Namespace: <strong className="text-foreground font-mono">{namespace}</strong></span>
                <span>•</span>
                <Badge variant="success" className="text-[10px] h-4.5 px-2 font-mono">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  TTY Session Active
                </Badge>
              </DialogDescription>
            </div>

            {containers.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Container:</span>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger className="h-8.5 w-36 text-xs font-mono">
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

          {/* Quick Preset Operations */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
              <Sparkles className="size-3 text-amber-500" /> Quick Presets:
            </span>
            {presets.map(p => (
              <Button
                key={p.label}
                variant="outline"
                size="xs"
                onClick={() => runCommand(p.cmd)}
                className="font-mono text-[11px] h-6 px-2 shadow-xs bg-muted/30 hover:bg-muted"
              >
                {p.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setHistory([])}
              className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground ml-auto"
            >
              <Trash2 className="size-3 mr-1" /> Clear
            </Button>
          </div>
        </DialogHeader>

        {/* Terminal Screen */}
        <div 
          ref={scrollRef}
          className="flex-1 min-h-[380px] max-h-[55vh] rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-y-auto space-y-2 shadow-inner select-text"
        >
          {history.map((line, idx) => (
            <div key={idx} className="leading-relaxed break-all">
              {line.type === 'command' && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="text-zinc-500">$</span>
                  <span>{line.text}</span>
                </div>
              )}
              {line.type === 'output' && (
                <pre className="text-zinc-200 whitespace-pre-wrap font-mono mt-0.5">
                  {line.text}
                </pre>
              )}
              {line.type === 'system' && (
                <div className="text-zinc-400 italic bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80 mb-2">
                  {line.text}
                </div>
              )}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
              root@{podName}:/app#
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputCommand}
              onChange={e => setInputCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={executing}
              placeholder="Type shell command..."
              className="flex-1 bg-transparent text-zinc-100 text-xs font-mono outline-none border-none p-0 focus:ring-0"
              autoFocus
            />
            {executing && (
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span className="text-[11px]">Use <kbd className="px-1 py-0.5 bg-muted rounded font-mono">↑</kbd> <kbd className="px-1 py-0.5 bg-muted rounded font-mono">↓</kbd> for command history</span>
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
