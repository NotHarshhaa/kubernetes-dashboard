"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Command, 
  Clock, 
  Container, 
  Network, 
  Database, 
  Server, 
  Activity,
  X,
  Boxes,
  KeyRound
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchItem {
  id: string
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  url: string
  keywords: string[]
  recent?: boolean
  trending?: boolean
}

const searchData: SearchItem[] = [
  {
    id: "1",
    title: "Workloads Hub",
    description: "Deployments, StatefulSets, DaemonSets, Jobs, CronJobs",
    category: "Workloads",
    icon: Boxes,
    url: "/workloads",
    keywords: ["workloads", "controllers", "deployments", "jobs", "cronjobs", "statefulsets", "daemonsets"]
  },
  {
    id: "2",
    title: "Pods & Logs",
    description: "Manage container instances and live streaming terminal logs",
    category: "Resources",
    icon: Container,
    url: "/pods",
    keywords: ["pods", "containers", "logs", "instances"]
  },
  {
    id: "3", 
    title: "Deployments",
    description: "Application scale and rolling restart management",
    category: "Workloads",
    icon: Database,
    url: "/deployments",
    keywords: ["deployments", "scaling", "rollout", "replicas"]
  },
  {
    id: "4", 
    title: "Services & Ingress",
    description: "Network routing, ClusterIP, LoadBalancers, and Ingress hosts",
    category: "Networking",
    icon: Network,
    url: "/services",
    keywords: ["services", "networking", "ingress", "endpoints", "loadbalancer"]
  },
  {
    id: "5",
    title: "Config & Secrets",
    description: "ConfigMaps, base64 credentials, and TLS certificates",
    category: "Configuration",
    icon: KeyRound,
    url: "/config",
    keywords: ["config", "configmaps", "secrets", "tls", "certificates", "environment"]
  },
  {
    id: "6",
    title: "Cluster Nodes",
    description: "Nodes compute capacity, cordoning, and drain controls",
    category: "Infrastructure",
    icon: Server,
    url: "/nodes",
    keywords: ["nodes", "infrastructure", "cordon", "drain", "capacity"]
  },
  {
    id: "7",
    title: "Monitoring & Metrics",
    description: "Live CPU, memory usage telemetry, and cluster alerts",
    category: "Monitoring",
    icon: Activity,
    url: "/monitoring",
    keywords: ["monitoring", "metrics", "alerts", "telemetry"]
  }
]

export function EnhancedSearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchItem[]>(searchData)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter query
  useEffect(() => {
    if (!query.trim()) {
      setResults(searchData)
    } else {
      const q = query.toLowerCase()
      setResults(
        searchData.filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some(k => k.toLowerCase().includes(q))
        )
      )
    }
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false)
    router.push(item.url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search resources, pods, services..."
          className="h-8 pl-8 pr-12 text-xs"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery("")}
              className="size-5 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </Button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1 text-[10px] font-mono text-muted-foreground bg-muted border rounded">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border bg-popover text-popover-foreground shadow-md z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
            {results.length > 0 ? (
              results.map((item, index) => {
                const Icon = item.icon
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-left text-xs transition-colors",
                      isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-md bg-muted text-foreground shrink-0">
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0 ml-2">
                      {item.category}
                    </Badge>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching resources found for &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
