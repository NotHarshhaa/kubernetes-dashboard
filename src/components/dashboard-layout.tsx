"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedSearch } from "@/components/enhanced-search"
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
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Layers,
  LucideIcon
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Overview", href: "/", icon: Home, description: "Cluster at a glance", color: "from-blue-500 to-blue-600" },
  { name: "Pods", href: "/pods", icon: Container, description: "Manage containers", color: "from-green-500 to-green-600" },
  { name: "Services", href: "/services", icon: Network, description: "Network services", color: "from-purple-500 to-purple-600" },
  { name: "Deployments", href: "/deployments", icon: Database, description: "Application deployments", color: "from-orange-500 to-orange-600" },
  { name: "Nodes", href: "/nodes", icon: Server, description: "Cluster nodes", color: "from-cyan-500 to-cyan-600" },
  { name: "Namespaces", href: "/namespaces", icon: Layers, description: "Resource isolation", color: "from-indigo-500 to-indigo-600" },
  { name: "Monitoring", href: "/monitoring", icon: Activity, description: "Metrics and logs", color: "from-pink-500 to-pink-600" },
  { name: "Settings", href: "/settings", icon: Settings, description: "Configuration", color: "from-slate-500 to-slate-600" },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { success, info } = useToast()

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  const handleLogout = () => {
    signOut()
    success("Successfully logged out")
    // The protected route will automatically redirect to sign-in page
  }

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href
    const Icon = item.icon as LucideIcon
    
    return (
      <a
        href={item.href}
        className={cn(
          "group relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-gradient-to-r " + item.color + " text-white shadow-lg scale-[1.02]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
          sidebarCollapsed ? "justify-center px-3" : "justify-between"
        )}
        title={sidebarCollapsed ? item.name : undefined}
      >
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
          isActive 
            ? "bg-white/20 shadow-inner" 
            : "bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700"
        )}>
          <Icon className={cn(
            "h-5 w-5 transition-all duration-200",
            isActive ? "text-white" : "text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
          )} />
        </div>
        {!sidebarCollapsed && (
          <div className="ml-3 flex-1">
            <div className={cn(
              "font-medium transition-all duration-200",
              isActive ? "text-white" : "text-slate-900 dark:text-white"
            )}>
              {item.name}
            </div>
            <div className={cn(
              "text-xs transition-all duration-200",
              isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400"
            )}>
              {item.description}
            </div>
          </div>
        )}
        {isActive && !sidebarCollapsed && (
          <div className="absolute right-2 h-2 w-2 rounded-full bg-white animate-pulse" />
        )}
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-slate-900 shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">K8s Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cluster Management</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="rounded-lg">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-6">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:bg-white/95 lg:border-r lg:border-slate-200/50 dark:lg:bg-slate-900/95 dark:lg:border-slate-700/50 lg:backdrop-blur-sm transition-all duration-300",
        sidebarCollapsed ? "lg:w-20" : "lg:w-80"
      )}>
        <div className={cn(
          "flex h-20 items-center border-b border-slate-200/50 dark:border-slate-700/50 transition-all duration-300",
          sidebarCollapsed ? "px-4 justify-center" : "px-6 justify-between"
        )}>
          <div className={cn(
            "flex items-center space-x-3 transition-all duration-300",
            sidebarCollapsed ? "" : ""
          )}>
            <div 
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-all duration-300 relative",
                sidebarCollapsed && "cursor-pointer hover:scale-110"
              )}
              onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <Shield className="h-6 w-6 text-white" />
              {sidebarCollapsed && (
                <div className="absolute -right-1 -top-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <ChevronRight className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">K8s Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cluster Management</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        <nav className={cn(
          "flex-1 space-y-2 px-3 py-6 transition-all duration-300",
          sidebarCollapsed ? "px-2 py-6 space-y-4" : ""
        )}>
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-4 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50">
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all duration-300 relative",
            sidebarCollapsed ? "justify-center" : ""
          )}>
            <Avatar className="h-10 w-10 ring-2 ring-slate-200 dark:ring-slate-700">
              <AvatarImage src="/avatars/01.png" alt="User" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">CA</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Cluster Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">admin@k8s.local</p>
                {isDemoMode && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      Demo Mode
                    </span>
                  </div>
                )}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            {sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-3 w-3 text-red-600 dark:text-red-400" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-80"
      )}>
        <div className="sticky top-0 z-40 flex h-20 items-center gap-x-4 border-b border-slate-200/50 bg-white/90 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/90 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <EnhancedSearch />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button variant="ghost" size="sm" className="relative rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
              </Button>
              <Badge variant="outline" className="border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1">
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
