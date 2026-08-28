"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Activity, 
  Container, 
  Database, 
  Home, 
  Network, 
  Settings, 
  Server, 
  Shield, 
  Layers, 
  Boxes, 
  KeyRound, 
  Bell, 
  LogOut,
  Sparkles,
  HardDrive,
  Package,
  ShieldCheck,
  GitFork,
  Terminal,
  LucideIcon 
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"
import { EnhancedSearch } from "@/components/enhanced-search"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const mainNavItems = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Workloads", href: "/workloads", icon: Boxes },
  { name: "Pods", href: "/pods", icon: Container },
  { name: "Deployments", href: "/deployments", icon: Database },
  { name: "Services & Ingress", href: "/services", icon: Network },
  { name: "Config & Secrets", href: "/config", icon: KeyRound },
  { name: "Storage & PVs", href: "/storage", icon: HardDrive },
  { name: "Helm Hub", href: "/helm", icon: Package },
  { name: "Nodes", href: "/nodes", icon: Server },
  { name: "Namespaces", href: "/namespaces", icon: Layers },
]

const secondaryNavItems = [
  { name: "Security & CIS", href: "/security", icon: ShieldCheck },
  { name: "Topology Map", href: "/topology", icon: GitFork },
  { name: "Web Terminal", href: "/terminal", icon: Terminal },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { success } = useToast()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

  const handleLogout = () => {
    signOut()
    success("Successfully logged out")
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset" collapsible="icon" className="border-r border-border/70">
        <SidebarHeader className="pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/70 transition-colors">
                <a href="/">
                  <div className="flex aspect-square size-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-sm">
                    <Shield className="size-4.5" />
                  </div>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-bold tracking-tight text-foreground text-sm">K8s Dashboard</span>
                    <span className="truncate text-[11px] text-muted-foreground">Cluster Management</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-3">
              Cluster Resources
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon as LucideIcon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        tooltip={item.name}
                        className={cn(
                          "rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                          isActive 
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs" 
                            : "hover:bg-sidebar-accent hover:text-foreground text-muted-foreground"
                        )}
                      >
                        <a href={item.href} className="flex items-center gap-2.5">
                          <Icon className={cn("size-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                          <span>{item.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-3">
              Operations & Telemetry
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon as LucideIcon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        tooltip={item.name}
                        className={cn(
                          "rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                          isActive 
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs" 
                            : "hover:bg-sidebar-accent hover:text-foreground text-muted-foreground"
                        )}
                      >
                        <a href={item.href} className="flex items-center gap-2.5">
                          <Icon className={cn("size-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                          <span>{item.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-border/60">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between p-2 rounded-xl bg-sidebar-accent/40 border border-border/40">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-7.5 border border-border/80">
                    <AvatarImage src="/avatars/01.png" alt="Admin" />
                    <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">CA</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-semibold text-foreground">Cluster Admin</span>
                    <span className="truncate text-[10px] text-muted-foreground font-mono">admin@k8s.local</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background/95">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1 size-8 rounded-lg hover:bg-muted" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <EnhancedSearch />
            </div>

            <div className="flex items-center gap-2.5">
              {isDemoMode && (
                <Badge variant="secondary" className="text-[11px] font-semibold gap-1 py-0.5">
                  <Sparkles className="size-3 text-amber-500" />
                  Demo Mode
                </Badge>
              )}
              
              <Button variant="ghost" size="icon" className="size-8 relative rounded-lg text-muted-foreground hover:text-foreground">
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 animate-pulse" />
              </Button>
              
              <Badge variant="outline" className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-foreground rounded-lg">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
