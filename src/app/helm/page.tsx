"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient, HelmRelease, HelmChart } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Package, 
  Download, 
  RotateCcw, 
  Trash2, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  Check
} from "lucide-react"

export default function HelmPage() {
  const [releases, setReleases] = useState<HelmRelease[]>([])
  const [charts, setCharts] = useState<HelmChart[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("releases")

  // Install Modal
  const [installDialog, setInstallDialog] = useState<{
    open: boolean
    chart: HelmChart | null
    releaseName: string
    namespace: string
  }>({
    open: false,
    chart: null,
    releaseName: '',
    namespace: 'default'
  })

  // Rollback Modal
  const [rollbackDialog, setRollbackDialog] = useState<{
    open: boolean
    release: HelmRelease | null
    targetRevision: number
  }>({
    open: false,
    release: null,
    targetRevision: 1
  })

  const { success, error: showError } = useToast()

  const fetchHelmData = useCallback(async () => {
    try {
      setLoading(true)
      const [relList, chartList] = await Promise.all([
        apiClient.getHelmReleases(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getHelmCharts()
      ])
      setReleases(relList)
      setCharts(chartList)
    } catch (err) {
      showError(`Failed to fetch Helm data: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, showError])

  useEffect(() => {
    fetchHelmData()
  }, [fetchHelmData])

  const handleInstall = async () => {
    if (!installDialog.chart) return
    try {
      await apiClient.installHelmChart(
        installDialog.chart.name,
        installDialog.releaseName || `${installDialog.chart.name}-app`,
        installDialog.namespace || 'default'
      )
      success(`Helm chart ${installDialog.chart.name} deployed successfully`)
      setInstallDialog({ open: false, chart: null, releaseName: '', namespace: 'default' })
      setActiveTab("releases")
      fetchHelmData()
    } catch (err) {
      showError(`Installation failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleRollback = async () => {
    if (!rollbackDialog.release) return
    try {
      await apiClient.rollbackHelmRelease(
        rollbackDialog.release.name,
        rollbackDialog.release.namespace,
        rollbackDialog.targetRevision
      )
      success(`Release ${rollbackDialog.release.name} rolled back to revision ${rollbackDialog.targetRevision}`)
      setRollbackDialog({ open: false, release: null, targetRevision: 1 })
      fetchHelmData()
    } catch (err) {
      showError(`Rollback failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const handleUninstall = async (release: HelmRelease) => {
    if (!confirm(`Uninstall Helm release ${release.name} from namespace ${release.namespace}?`)) return
    try {
      await apiClient.uninstallHelmRelease(release.name, release.namespace)
      success(`Release ${release.name} uninstalled`)
      fetchHelmData()
    } catch (err) {
      showError(`Uninstall failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const filteredReleases = releases.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.chart.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCharts = charts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const namespaces = Array.from(new Set(releases.map(r => r.namespace)))

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Package className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Helm Hub & Catalog</h1>
                  <p className="text-muted-foreground text-xs">Installed package releases, revision history rollbacks, and 1-click cloud native chart marketplace</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={fetchHelmData}>
                <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Installed Releases</CardTitle>
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Package className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">{releases.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Managed Helm package instances</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marketplace Catalog</CardTitle>
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <Sparkles className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">{charts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Verified cloud-native charts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Healthy Deployed</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {releases.filter(r => r.status === 'deployed').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active live releases</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant Namespaces</CardTitle>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Layers className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">{namespaces.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Namespaces with Helm apps</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search releases or catalog charts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-8.5"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedNamespace}
                onChange={e => setSelectedNamespace(e.target.value)}
                className="h-8.5 px-3 rounded-lg text-xs border border-input bg-background text-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="all">All Namespaces</option>
                {namespaces.map(ns => (
                  <option key={ns} value={ns}>
                    {ns}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="releases" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 w-80 h-auto p-1">
              <TabsTrigger value="releases" className="font-semibold">
                Installed Releases ({filteredReleases.length})
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="font-semibold">
                Marketplace Catalog ({filteredCharts.length})
              </TabsTrigger>
            </TabsList>

            {/* 1. Installed Releases Tab */}
            <TabsContent value="releases">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Release Name</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Chart Version</TableHead>
                      <TableHead>App Version</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReleases.map(rel => (
                      <TableRow key={`${rel.namespace}-${rel.name}`}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Package className="size-4 text-primary" />
                            <div>
                              <span className="font-mono text-xs">{rel.name}</span>
                              <div className="text-[11px] text-muted-foreground font-normal">{rel.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{rel.namespace}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{rel.chart}</TableCell>
                        <TableCell className="font-mono text-xs">{rel.appVersion}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            rev-{rel.revision}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rel.status === 'deployed' ? 'success' : 'destructive'} className="text-xs">
                            {rel.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(rel.updated).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRollbackDialog({ open: true, release: rel, targetRevision: Math.max(1, rel.revision - 1) })}
                              className="h-7.5 text-xs shadow-xs"
                            >
                              <RotateCcw className="size-3.5 mr-1" /> Rollback
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleUninstall(rel)}
                              className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Uninstall Release"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* 2. Marketplace Catalog Tab */}
            <TabsContent value="marketplace">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredCharts.map(chart => (
                  <Card key={chart.name} className="flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                          <Package className="size-5" />
                        </div>
                        {chart.installed ? (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <Check className="size-3" /> Installed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            v{chart.version}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-bold mt-2 font-mono">{chart.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 min-h-8">
                        {chart.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="text-[11px] font-mono text-muted-foreground truncate" title={chart.repository}>
                          Repo: {chart.repository}
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs font-semibold shadow-xs"
                          onClick={() => setInstallDialog({
                            open: true,
                            chart,
                            releaseName: `${chart.name}-app`,
                            namespace: 'default'
                          })}
                        >
                          <Download className="size-3.5 mr-1.5" />
                          {chart.installed ? 'Deploy Another' : '1-Click Install'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* 1-Click Install Modal */}
          <Dialog open={installDialog.open} onOpenChange={open => setInstallDialog(prev => ({ ...prev, open }))}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="size-4.5 text-primary" />
                  <span>Deploy Helm Chart:</span>
                  <span className="font-mono text-primary">{installDialog.chart?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Configure release name and target namespace
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Release Name</Label>
                  <Input
                    value={installDialog.releaseName}
                    onChange={e => setInstallDialog(prev => ({ ...prev, releaseName: e.target.value }))}
                    className="h-8.5 text-xs font-mono"
                    placeholder="e.g. ingress-nginx-prod"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Namespace</Label>
                  <select
                    value={installDialog.namespace}
                    onChange={e => setInstallDialog(prev => ({ ...prev, namespace: e.target.value }))}
                    className="w-full h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs font-mono outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  >
                    <option value="default">default</option>
                    <option value="production">production</option>
                    <option value="staging">staging</option>
                    <option value="monitoring">monitoring</option>
                    <option value="kube-system">kube-system</option>
                  </select>
                </div>

                <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-xs space-y-1">
                  <div className="text-muted-foreground">Chart: <strong className="text-foreground font-mono">{installDialog.chart?.name}:{installDialog.chart?.version}</strong></div>
                  <div className="text-muted-foreground">App Version: <strong className="text-foreground font-mono">{installDialog.chart?.appVersion}</strong></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setInstallDialog(prev => ({ ...prev, open: false }))}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleInstall}>
                  Install Chart
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Rollback Modal */}
          <Dialog open={rollbackDialog.open} onOpenChange={open => setRollbackDialog(prev => ({ ...prev, open }))}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RotateCcw className="size-4.5 text-amber-500" />
                  <span>Rollback Release:</span>
                  <span className="font-mono text-primary">{rollbackDialog.release?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Select target revision to restore deployment state
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/30">
                  <span className="text-xs text-muted-foreground font-medium">Current Revision</span>
                  <span className="text-sm font-bold font-mono text-foreground">rev-{rollbackDialog.release?.revision}</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Rollback Revision</Label>
                  <select
                    value={rollbackDialog.targetRevision}
                    onChange={e => setRollbackDialog(prev => ({ ...prev, targetRevision: parseInt(e.target.value) || 1 }))}
                    className="w-full h-8.5 px-3 border border-input rounded-lg bg-background text-foreground text-xs font-mono outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  >
                    {Array.from({ length: Math.max(1, (rollbackDialog.release?.revision || 2) - 1) }, (_, i) => i + 1).map(rev => (
                      <option key={rev} value={rev}>
                        Revision {rev}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setRollbackDialog(prev => ({ ...prev, open: false }))}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRollback}>
                  Confirm Rollback
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
