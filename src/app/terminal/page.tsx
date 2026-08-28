"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, Pod } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Terminal, 
  Trash2, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Server, 
  Container,
  Send
} from "lucide-react"

interface TerminalLine {
  type: 'command' | 'output' | 'system'
  text: string
  timestamp: string
}

export default function TerminalPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPodName, setSelectedPodName] = useState<string>("")
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default")
  const [selectedContainer, setSelectedContainer] = useState<string>("main")
  
  const [inputCommand, setInputCommand] = useState("")
  const [history, setHistory] = useState<TerminalLine[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [executing, setExecuting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { success, error: showError } = useToast()

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

  useEffect(() => {
    if (selectedPodName) {
      setHistory([
        {
          type: 'system',
          text: `Initialized interactive TTY shell session for pod [${selectedPodName}] container [${selectedContainer}] (${selectedNamespace}).\nType 'help' for command recommendations or click quick preset buttons above.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ])
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [selectedPodName, selectedNamespace, selectedContainer])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const runCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun !== undefined ? cmdToRun : inputCommand).trim()
    if (!cmd) return

    const now = new Date().toLocaleTimeString()

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
      const res = await apiClient.execCommand(selectedPodName, selectedNamespace, selectedContainer, cmd)
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

  const handlePodChange = (podKey: string) => {
    const [ns, name] = podKey.split(':')
    const pod = pods.find(p => p.namespace === ns && p.name === name)
    if (pod) {
      setSelectedPodName(pod.name)
      setSelectedNamespace(pod.namespace)
      setSelectedContainer(pod.containers?.[0]?.name || 'main')
    }
  }

  const downloadLog = () => {
    const text = history.map(h => `[${h.timestamp}] ${h.type.toUpperCase()}: ${h.text}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terminal-session-${selectedNamespace}-${selectedPodName}.log`
    a.click()
    URL.revokeObjectURL(url)
    success("Terminal log downloaded")
  }

  const selectedPod = pods.find(p => p.name === selectedPodName && p.namespace === selectedNamespace)
  const containers = selectedPod?.containers || [{ name: 'main' }]

  const presets = [
    { label: "ps aux", cmd: "ps aux" },
    { label: "top", cmd: "top" },
    { label: "df -h", cmd: "df -h" },
    { label: "env", cmd: "env" },
    { label: "netstat", cmd: "netstat -tlpn" },
    { label: "os-info", cmd: "cat /etc/os-release" },
    { label: "dns-config", cmd: "cat /etc/resolv.conf" },
    { label: "curl :8080", cmd: "curl localhost:8080/healthz" }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Terminal className="size-5 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Interactive Web Terminal
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    Live container shell execution, runtime diagnostics, and process exploration via web TTY
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadLog}>
                <Download className="size-3.5 mr-1.5" />
                Save Session Log
              </Button>
              <Button size="sm" onClick={fetchPods}>
                <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Pods
              </Button>
            </div>
          </div>

          {/* Session Configuration Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Target Pod:</span>
                <select
                  value={`${selectedNamespace}:${selectedPodName}`}
                  onChange={e => handlePodChange(e.target.value)}
                  className="h-8.5 px-3 rounded-lg text-xs font-mono border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs min-w-56"
                >
                  {pods.map(p => (
                    <option key={`${p.namespace}:${p.name}`} value={`${p.namespace}:${p.name}`}>
                      {p.namespace} / {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {containers.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Container:</span>
                  <select
                    value={selectedContainer}
                    onChange={e => setSelectedContainer(e.target.value)}
                    className="h-8.5 px-3 rounded-lg text-xs font-mono border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  >
                    {containers.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[11px] gap-1 px-2.5 h-6 font-mono">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
                TTY Active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistory([])}
                className="text-xs h-8"
              >
                <Trash2 className="size-3.5 mr-1" /> Clear
              </Button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
              <Sparkles className="size-3 text-amber-500" /> Quick Presets:
            </span>
            {presets.map(p => (
              <Button
                key={p.label}
                variant="outline"
                size="xs"
                onClick={() => runCommand(p.cmd)}
                className="font-mono text-[11px] h-6 px-2.5 shadow-xs bg-muted/30 hover:bg-muted"
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Fullscreen Style Terminal Screen */}
          <div className="rounded-2xl border border-border/80 bg-zinc-950 text-zinc-100 p-5 font-mono text-xs shadow-2xl flex flex-col min-h-[520px] max-h-[70vh]">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-2.5 pr-2 select-text"
            >
              {history.map((line, idx) => (
                <div key={idx} className="leading-relaxed break-all">
                  {line.type === 'command' && (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
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
                    <div className="text-zinc-400 italic bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 mb-3">
                      {line.text}
                    </div>
                  )}
                </div>
              ))}

              {/* Active Prompt Line */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                  root@{selectedPodName || 'container'}:/app#
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputCommand}
                  onChange={e => setInputCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={executing}
                  placeholder="Enter shell command..."
                  className="flex-1 bg-transparent text-zinc-100 text-xs font-mono outline-none border-none p-0 focus:ring-0"
                  autoFocus
                />
                {executing && (
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
              <span>Connected: <strong>{selectedNamespace}/{selectedPodName}</strong> ({selectedContainer})</span>
              <span>Use <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300 font-mono">↑</kbd> <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300 font-mono">↓</kbd> for command history</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
