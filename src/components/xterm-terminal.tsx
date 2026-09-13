"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Copy, Sparkles, Terminal as TerminalIcon, Check } from "lucide-react"

interface XtermTerminalProps {
  podName: string
  namespace: string
  container: string
  onExecuteCommand: (command: string) => Promise<{ output: string; exitCode: number; isRealCluster?: boolean }>
  height?: string
}

export function XtermTerminal({
  podName,
  namespace,
  container,
  onExecuteCommand,
  height = "520px"
}: XtermTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const currentLineRef = useRef<string>("")
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isExecutingRef = useRef<boolean>(false)
  const [copied, setCopied] = useState(false)
  const [isLiveExec, setIsLiveExec] = useState<boolean | null>(null)

  const promptStr = `\x1b[1;32mroot@${podName || 'pod'}\x1b[0m:\x1b[1;34m/${container || 'main'}\x1b[0m# `

  const writePrompt = useCallback(() => {
    if (termRef.current) {
      termRef.current.write(`\r\n${promptStr}`)
      currentLineRef.current = ""
    }
  }, [promptStr])

  const runCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim()
    if (!termRef.current) return

    if (!trimmed) {
      writePrompt()
      return
    }

    if (trimmed === 'clear') {
      termRef.current.clear()
      termRef.current.write(promptStr)
      currentLineRef.current = ""
      return
    }

    // Add to command history
    historyRef.current.push(trimmed)
    historyIndexRef.current = historyRef.current.length

    isExecutingRef.current = true
    termRef.current.write('\r\n')

    try {
      const res = await onExecuteCommand(trimmed)
      setIsLiveExec(!!res.isRealCluster)

      if (res.output === '__CLEAR__') {
        termRef.current.clear()
      } else if (res.output) {
        // Format newlines for raw terminal carriage returns
        const formatted = res.output
          .split('\n')
          .map(line => `\r\n${line}`)
          .join('')
        termRef.current.write(formatted)
      }

      if (res.exitCode !== 0) {
        termRef.current.write(`\r\n\x1b[1;31m[Process completed with exit code ${res.exitCode}]\x1b[0m`)
      }
    } catch (err) {
      termRef.current.write(`\r\n\x1b[1;31mError: ${err instanceof Error ? err.message : 'Execution failed'}\x1b[0m`)
    } finally {
      isExecutingRef.current = false
      writePrompt()
    }
  }, [onExecuteCommand, promptStr, writePrompt])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      lineHeight: 1.25,
      theme: {
        background: '#090d16',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        selectionBackground: '#334155',
        black: '#0f172a',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#38bdf8',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#eab308',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff'
      }
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Initial banner
    term.writeln('\x1b[1;36m══════════════════════════════════════════════════════════════\x1b[0m')
    term.writeln(`\x1b[1;37m☸  Kubernetes Interactive Container Terminal\x1b[0m`)
    term.writeln(`\x1b[0;90m• Pod:\x1b[0m \x1b[1;33m${podName || 'active'}\x1b[0m   \x1b[0;90m• Namespace:\x1b[0m \x1b[1;33m${namespace || 'default'}\x1b[0m   \x1b[0;90m• Container:\x1b[0m \x1b[1;33m${container || 'main'}\x1b[0m`)
    term.writeln(`\x1b[0;90m• Type commands or click quick diagnostic shortcuts below. Type 'help' for options.\x1b[0m`)
    term.writeln('\x1b[1;36m══════════════════════════════════════════════════════════════\x1b[0m')
    term.write(promptStr)

    // Keyboard listener
    const onDataDisposable = term.onData((data) => {
      if (isExecutingRef.current) return

      // Handle special keys
      switch (data) {
        case '\r': // Enter
          runCommand(currentLineRef.current)
          break

        case '\u007F': // Backspace
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1)
            term.write('\b \b')
          }
          break

        case '\u0003': // Ctrl+C
          term.write('^C\r\n')
          currentLineRef.current = ""
          term.write(promptStr)
          break

        case '\u000c': // Ctrl+L (clear)
          term.clear()
          term.write(promptStr)
          currentLineRef.current = ""
          break

        case '\u001b[A': // Up Arrow (History)
          if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
            historyIndexRef.current--
            const cmd = historyRef.current[historyIndexRef.current]
            // Clear current line
            while (currentLineRef.current.length > 0) {
              term.write('\b \b')
              currentLineRef.current = currentLineRef.current.slice(0, -1)
            }
            term.write(cmd)
            currentLineRef.current = cmd
          }
          break

        case '\u001b[B': // Down Arrow (History)
          if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++
            const cmd = historyRef.current[historyIndexRef.current]
            while (currentLineRef.current.length > 0) {
              term.write('\b \b')
              currentLineRef.current = currentLineRef.current.slice(0, -1)
            }
            term.write(cmd)
            currentLineRef.current = cmd
          } else if (historyIndexRef.current === historyRef.current.length - 1) {
            historyIndexRef.current = historyRef.current.length
            while (currentLineRef.current.length > 0) {
              term.write('\b \b')
              currentLineRef.current = currentLineRef.current.slice(0, -1)
            }
          }
          break

        default:
          if (data >= ' ' || data === '\t') {
            currentLineRef.current += data
            term.write(data)
          }
          break
      }
    })

    const handleResize = () => {
      try {
        fitAddon.fit()
      } catch {}
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      onDataDisposable.dispose()
      term.dispose()
    }
  }, [podName, namespace, container, promptStr, runCommand])

  const handleClear = () => {
    if (termRef.current) {
      termRef.current.clear()
      termRef.current.write(promptStr)
      currentLineRef.current = ""
    }
  }

  const handleCopy = () => {
    if (termRef.current) {
      termRef.current.selectAll()
      const selection = termRef.current.getSelection()
      navigator.clipboard.writeText(selection)
      termRef.current.clearSelection()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const quickCommands = [
    { label: "ps aux", cmd: "ps aux" },
    { label: "top", cmd: "top" },
    { label: "df -h", cmd: "df -h" },
    { label: "env", cmd: "env" },
    { label: "netstat", cmd: "netstat -tlpn" },
    { label: "os-release", cmd: "cat /etc/os-release" },
  ]

  return (
    <div className="flex flex-col border border-border/80 rounded-xl overflow-hidden shadow-lg bg-[#090d16]">
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-border/70 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <div className="h-3.5 w-px bg-border/60 mx-1" />
          <span className="font-mono text-[11px] text-foreground font-semibold flex items-center gap-1">
            <TerminalIcon className="size-3.5 text-primary" />
            {podName || 'cluster'}:{container || 'sh'}
          </span>
          {isLiveExec !== null && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4.5 ${isLiveExec ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-blue-500/40 text-blue-400 bg-blue-500/10'}`}>
              {isLiveExec ? 'Live K8s Exec' : 'Simulated Session'}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3.5 text-emerald-400 mr-1" /> : <Copy className="size-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleClear}
          >
            <Trash2 className="size-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* xterm.js Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ height }}
        className="w-full p-2.5 focus:outline-none"
      />

      {/* Quick Diagnostic Shortcuts Pill Bar */}
      <div className="px-3 py-2 bg-slate-900/60 border-t border-border/50 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="size-3 text-primary" /> Quick Run:
        </span>
        <div className="flex items-center gap-1.5">
          {quickCommands.map(({ label, cmd }) => (
            <button
              key={label}
              type="button"
              onClick={() => runCommand(cmd)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
