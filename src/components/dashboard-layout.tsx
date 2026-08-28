"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
  { name: "Nodes", href: "/nodes", icon: Server },
  { name: "Namespaces", href: "/namespaces", icon: Layers },
]

const secondaryNavItems = [
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
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Shield className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">K8s Dashboard</span>
                    <span className="truncate text-xs text-muted-foreground">Cluster Management</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Cluster Resources</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => {
                  const Icon = item.icon as LucideIcon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                        <a href={item.href}>
                          <Icon className="size-4" />
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
            <SidebarGroupLabel>Operations & System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon as LucideIcon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                        <a href={item.href}>
                          <Icon className="size-4" />
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

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-7">
                    <AvatarImage src="/avatars/01.png" alt="Admin" />
                    <AvatarFallback className="text-xs">CA</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-medium">Cluster Admin</span>
                    <span className="truncate text-[10px] text-muted-foreground">admin@k8s.local</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-7 text-muted-foreground hover:text-foreground"
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

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <EnhancedSearch />
            </div>

            <div className="flex items-center gap-3">
              {isDemoMode && (
                <Badge variant="secondary" className="text-xs">
                  Demo Mode
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="size-8 relative text-muted-foreground hover:text-foreground">
                <Bell className="size-4" />
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-destructive" />
              </Button>
              <Badge variant="outline" className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Connected
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
