"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Container, 
  Network, 
  Database, 
  Server, 
  Activity,
  X,
  Boxes,
  KeyRound,
  Layers,
  Settings,
  ArrowRight,
  HardDrive,
  Package,
  ShieldCheck,
  GitFork,
  Terminal
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
    title: "Pods & Terminal Logs",
    description: "Container instances, real-time logs stream, and diagnostics",
    category: "Resources",
    icon: Container,
    url: "/pods",
    keywords: ["pods", "containers", "logs", "instances"]
  },
  {
    id: "3", 
    title: "Deployments",
    description: "Horizontal scaling and rolling zero-downtime restarts",
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
    title: "Storage & Persistent Volumes",
    description: "PVs, PVCs, and StorageClasses capacity management",
    category: "Storage",
    icon: HardDrive,
    url: "/storage",
    keywords: ["storage", "pv", "pvc", "persistentvolume", "volumes", "storageclass", "ebs", "nfs"]
  },
  {
    id: "7",
    title: "Helm Hub & Catalog",
    description: "Installed Helm releases and 1-click cloud-native charts",
    category: "Packaging",
    icon: Package,
    url: "/helm",
    keywords: ["helm", "charts", "releases", "marketplace", "install", "packages"]
  },
  {
    id: "8",
    title: "Cluster Nodes",
    description: "Compute capacity, hardware conditions, and cordoning",
    category: "Infrastructure",
    icon: Server,
    url: "/nodes",
    keywords: ["nodes", "infrastructure", "cordon", "drain", "capacity"]
  },
  {
    id: "9",
    title: "Namespaces",
    description: "Tenancy boundaries, resource quotas, and access scopes",
    category: "Tenancy",
    icon: Layers,
    url: "/namespaces",
    keywords: ["namespaces", "quotas", "tenants", "isolation"]
  },
  {
    id: "10",
    title: "Security & CIS Posture",
    description: "Automated CIS benchmarks, vulnerability audits & hardening",
    category: "Security",
    icon: ShieldCheck,
    url: "/security",
    keywords: ["security", "cis", "benchmark", "compliance", "vulnerabilities", "audit", "rbac"]
  },
  {
    id: "11",
    title: "Architecture Topology Map",
    description: "Visual dependency graph of Ingress, Services, Pods and Storage",
    category: "Visualization",
    icon: GitFork,
    url: "/topology",
    keywords: ["topology", "graph", "architecture", "visualization", "map", "dependencies"]
  },
  {
    id: "12",
    title: "Web Terminal",
    description: "Interactive container shell execution with command history",
    category: "Tools",
    icon: Terminal,
    url: "/terminal",
    keywords: ["terminal", "shell", "exec", "sh", "bash", "console", "cli"]
  },
  {
    id: "13",
    title: "Monitoring & Metrics",
    description: "Live CPU, memory usage telemetry, and cluster alerts",
    category: "Monitoring",
    icon: Activity,
    url: "/monitoring",
    keywords: ["monitoring", "metrics", "alerts", "telemetry"]
  },
  {
    id: "14",
    title: "Cluster Settings",
    description: "Alert triggers, API tokens, audit logs, and language",
    category: "Settings",
    icon: Settings,
    url: "/settings",
    keywords: ["settings", "preferences", "tokens", "alerts"]
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
          className="h-8.5 pl-8.5 pr-12 text-xs rounded-lg"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setQuery("")}
              className="size-5 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </Button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border/60 rounded-md">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md z-50 overflow-hidden duration-150">
          <div className="p-1.5 border-b border-border/50 text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3">
            Quick Navigation & Resources
          </div>
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
                      "w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors duration-150 cursor-pointer",
                      isSelected ? "bg-primary text-primary-foreground font-medium shadow-xs" : "hover:bg-muted/70 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-1.5 rounded-md shrink-0", isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-primary border border-border/50")}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{item.title}</div>
                        <div className={cn("text-[11px] truncate", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>{item.description}</div>
                      </div>
                    </div>
                    <Badge variant={isSelected ? "secondary" : "outline"} className="text-[10px] h-4.5 px-1.5 shrink-0 ml-2 font-mono">
                      {item.category}
                    </Badge>
                  </button>
                )
              })
            ) : (
              <div className="p-5 text-center text-xs text-muted-foreground">
                No matching resources found for &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
