"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { apiClient, HorizontalPodAutoscalerItem } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Zap, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  FileCode2, 
  Layers, 
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Scale,
  Gauge,
  Activity
} from "lucide-react"

export default function AutoscalingPage() {
  const [hpas, setHpas] = useState<HorizontalPodAutoscalerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [selectedHpaForYaml, setSelectedHpaForYaml] = useState<HorizontalPodAutoscalerItem | null>(null)
  const [yamlOpen, setYamlOpen] = useState(false)
  const { error: showError } = useToast()

  const fetchHpas = useCallback(async () => {
    try {
      setLoading(true)
      const ns = selectedNamespace === 'all' ? undefined : selectedNamespace
      const data = await apiClient.getHPAs(ns)
      setHpas(data)
    } catch (err) {
      showError(`Failed to load autoscaling data: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, showError])

  useEffect(() => {
    fetchHpas()
  }, [fetchHpas])

  const filtered = hpas.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.targetName.toLowerCase().includes(search.toLowerCase()) ||
    h.namespace.toLowerCase().includes(search.toLowerCase())
  )

  const activeScalingCount = hpas.filter(h => h.status === 'Scaling').length
  const atMaxCount = hpas.filter(h => h.status === 'AtMax').length

  const handleInspectYaml = (hpa: HorizontalPodAutoscalerItem) => {
    setSelectedHpaForYaml(hpa)
    setYamlOpen(true)
  }

  const generatedYaml = selectedHpaForYaml ? `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${selectedHpaForYaml.name}
  namespace: ${selectedHpaForYaml.namespace}
  creationTimestamp: "${selectedHpaForYaml.creationTimestamp}"
  labels:
    app.kubernetes.io/managed-by: kubernetes-dashboard
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: ${selectedHpaForYaml.targetKind}
    name: ${selectedHpaForYaml.targetName}
  minReplicas: ${selectedHpaForYaml.minReplicas}
  maxReplicas: ${selectedHpaForYaml.maxReplicas}
  metrics:
${JSON.stringify(selectedHpaForYaml.metrics, null, 4)}
status:
  currentReplicas: ${selectedHpaForYaml.currentReplicas}
  desiredReplicas: ${selectedHpaForYaml.desiredReplicas}
  lastScaleTime: "${selectedHpaForYaml.lastScaleTime || ''}"
  conditions:
${JSON.stringify(selectedHpaForYaml.conditions, null, 4)}
` : ''

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Scale className="size-6 text-primary" />
                  Workload Autoscaling (HPA)
                </h2>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">
                  autoscaling/v2
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Automated dynamic horizontal pod scaling, resource utilization thresholds, and custom metric policies
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Namespace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Namespaces</SelectItem>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchHpas}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Configured HPAs
                </CardTitle>
                <Scale className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hpas.length}</div>
                <p className="text-xs text-muted-foreground">Active autoscaling targets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Active Scaling Events
                </CardTitle>
                <TrendingUp className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{activeScalingCount}</div>
                <p className="text-xs text-muted-foreground">Replicas actively adjusting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  At Maximum Limit
                </CardTitle>
                <AlertTriangle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{atMaxCount}</div>
                <p className="text-xs text-muted-foreground">Hit max replica ceiling</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Scaling Engine
                </CardTitle>
                <Zap className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Autopilot</div>
                <p className="text-xs text-muted-foreground">CPU, Memory & External traffic</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search HPAs by name or target..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HPA Name</TableHead>
                    <TableHead>Target Workload</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Min / Max Replicas</TableHead>
                    <TableHead>Current Replicas</TableHead>
                    <TableHead>Metric Utilization vs Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        <RefreshCw className="size-5 animate-spin inline mr-2 text-primary" />
                        Querying HorizontalPodAutoscalers...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No Autoscalers found matching &quot;{search}&quot;
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((hpa) => {
                      const primaryMetric = hpa.metrics[0]
                      const curUtil = primaryMetric?.currentUtilization ?? 50
                      const tgtUtil = primaryMetric?.targetUtilization ?? 70
                      const isOverTarget = curUtil > tgtUtil

                      return (
                        <TableRow key={hpa.name} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Scale className="size-3.5 text-primary" />
                              {hpa.name}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded font-semibold">
                              {hpa.targetKind}/{hpa.targetName}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {hpa.namespace}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs">
                              {hpa.minReplicas} min / <span className="font-bold">{hpa.maxReplicas} max</span>
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                              <span>{hpa.currentReplicas}</span>
                              {hpa.desiredReplicas !== hpa.currentReplicas && (
                                <span className="text-primary text-[11px] flex items-center">
                                  <ArrowUpRight className="size-3" /> {hpa.desiredReplicas}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1 w-[190px]">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-muted-foreground">{primaryMetric?.type || 'CPU'}:</span>
                                <span className={isOverTarget ? 'text-amber-400 font-bold' : 'text-foreground'}>
                                  {primaryMetric?.currentUtilization !== undefined ? `${primaryMetric.currentUtilization}%` : primaryMetric?.currentValue || '-'}
                                  {' / '}
                                  <span className="text-muted-foreground">
                                    {primaryMetric?.targetUtilization !== undefined ? `${primaryMetric.targetUtilization}%` : primaryMetric?.targetValue || '-'}
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isOverTarget ? 'bg-amber-400' : 'bg-primary'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.round((curUtil / (tgtUtil || 100)) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="default"
                              className={`text-[11px] ${
                                hpa.status === 'Healthy'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : hpa.status === 'Scaling'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              <CheckCircle2 className="size-3 mr-1" />
                              {hpa.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => handleInspectYaml(hpa)}
                            >
                              <FileCode2 className="size-3.5" />
                              YAML
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* YAML Inspector Modal */}
        {selectedHpaForYaml && (
          <YamlViewerDialog
            open={yamlOpen}
            onOpenChange={setYamlOpen}
            resourceKind="HorizontalPodAutoscaler"
            resourceName={selectedHpaForYaml.name}
            rawYaml={generatedYaml}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
