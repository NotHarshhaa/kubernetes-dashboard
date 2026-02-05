"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Activity, 
  Container, 
  Database, 
  Home, 
  Menu, 
  Network, 
  Settings, 
  X,
  Server,
  Shield,
  ChevronDown,
  Bell,
  Search
} from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: Home, description: "Cluster at a glance" },
  { name: "Pods", href: "/pods", icon: Container, description: "Manage containers" },
  { name: "Services", href: "/services", icon: Network, description: "Network services" },
  { name: "Deployments", href: "/deployments", icon: Database, description: "Application deployments" },
  { name: "Nodes", href: "/nodes", icon: Server, description: "Cluster nodes" },
  { name: "Monitoring", href: "/monitoring", icon: Activity, description: "Metrics and logs" },
  { name: "Settings", href: "/settings", icon: Settings, description: "Configuration" },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-slate-900 shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">K8s Dashboard</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <item.icon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                </div>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:bg-white lg:border-r lg:border-slate-200 dark:lg:bg-slate-900 dark:lg:border-slate-700">
        <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">K8s Dashboard</h2>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="group flex items-center rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <item.icon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
              </div>
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Cluster Admin</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">admin@k8s.local</p>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              <Badge variant="outline" className="border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                Connected
              </Badge>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
