"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Command, 
  Clock, 
  TrendingUp, 
  Container, 
  Network, 
  Database, 
  Server, 
  Activity,
  X,
  ArrowRight,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const mockSearchData: SearchItem[] = [
  {
    id: "1",
    title: "Pod Management",
    description: "View and manage container pods",
    category: "Resources",
    icon: Container,
    url: "/pods",
    keywords: ["pods", "containers", "management"],
    trending: true
  },
  {
    id: "2", 
    title: "Service Discovery",
    description: "Network services and endpoints",
    category: "Networking",
    icon: Network,
    url: "/services",
    keywords: ["services", "networking", "endpoints"]
  },
  {
    id: "3",
    title: "Deployment Status",
    description: "Application deployments and replicas",
    category: "Workloads",
    icon: Database,
    url: "/deployments",
    keywords: ["deployments", "applications", "replicas"]
  },
  {
    id: "4",
    title: "Node Health",
    description: "Cluster nodes and infrastructure",
    category: "Infrastructure",
    icon: Server,
    url: "/nodes",
    keywords: ["nodes", "infrastructure", "health"]
  },
  {
    id: "5",
    title: "Monitoring Dashboard",
    description: "Metrics, logs and performance data",
    category: "Monitoring",
    icon: Activity,
    url: "/monitoring",
    keywords: ["monitoring", "metrics", "logs", "performance"],
    recent: true
  }
]

export function EnhancedSearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchItem[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('k8s-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Filter results based on query
  const filterResults = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      return mockSearchData
    }

    const lowercaseQuery = searchQuery.toLowerCase()
    return mockSearchData.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    )
  }, [])

  // Update results when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(true)
      const filtered = filterResults(query)
      setResults(filtered)
      setSelectedIndex(-1)
      setIsSearching(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [query, filterResults])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev <= 0 ? results.length - 1 : prev - 1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results])

  // Handle global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleGlobalShortcut)
    return () => document.removeEventListener('keydown', handleGlobalShortcut)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: SearchItem) => {
    // Add to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('k8s-recent-searches', JSON.stringify(newRecent))
    
    // Navigate to selected item
    router.push(item.url)
    setIsOpen(false)
    setQuery("")
  }

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('k8s-recent-searches')
  }

  const IconComponent = ({ item }: { item: SearchItem }) => {
    const Icon = item.icon
    return <Icon className="h-5 w-5" />
  }

  return (
    <div ref={searchRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search resources, pods, services..."
          className={cn(
            "w-full rounded-xl border border-slate-200/50 bg-slate-50/50 pl-12 pr-20 py-4 text-base text-slate-900 placeholder-slate-500",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400",
            "transition-all duration-200",
            isOpen && "ring-2 ring-blue-500/20 border-blue-500"
          )}
        />
        
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="h-6 w-6 p-0 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-600">
            <Command className="h-3 w-3 mr-1" />
            K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>Recent Searches</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearch(search)}
                        className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((item, index) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-150",
                          "hover:bg-slate-100 dark:hover:bg-slate-800",
                          selectedIndex === index && "bg-slate-100 dark:bg-slate-800 ring-1 ring-blue-500"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg",
                          "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <IconComponent item={item} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {item.title}
                            </span>
                            {item.trending && (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            )}
                            {item.recent && (
                              <Badge variant="secondary" className="text-xs">Recent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {item.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </motion.button>
                    ))}
                  </div>
                ) : query ? (
                  <div className="py-8 text-center">
                    <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 px-3">
                      <Filter className="h-4 w-4" />
                      <span>Quick Access</span>
                    </div>
                    <div className="space-y-1">
                      {results.slice(0, 3).map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <IconComponent item={item} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {item.title}
                              </span>
                              {item.trending && (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with keyboard hints */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
