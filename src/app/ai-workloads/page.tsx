"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient, AiClusterData } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Thermometer, 
  HardDrive,
  BrainCircuit,
  Bot
} from "lucide-react"

export default function AiWorkloadsPage() {
  const [data, setData] = useState<AiClusterData | null>(null)
  const [loading, setLoading] = useState(true)
  const { error: showError } = useToast()

  const fetchAiData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.getAIWorkloads()
      setData(res)
    } catch (err) {
      showError(`Failed to fetch AI cluster data: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchAiData()
  }, [fetchAiData])

  const inventory = data?.inventory
  const cards = data?.cards || []
  const workloads = data?.workloads || []
  const runtime = data?.runtime

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <BrainCircuit className="size-6 text-primary" />
                  AI & GPU Workloads
                </h2>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                  NVIDIA / AMD Accelerators
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                GPU hardware allocation, VRAM footprint, and live LLM inference runtime monitoring (vLLM, Ollama, KubeRay)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAiData}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Telemetry
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  GPU Accelerators
                </CardTitle>
                <Cpu className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory?.allocatedGpus || 0} / {inventory?.totalGpus || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {inventory?.freeGpus || 0} GPUs available for scheduling
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  VRAM Allocation
                </CardTitle>
                <HardDrive className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory?.allocatedVramGb || 0} <span className="text-xs font-normal text-muted-foreground">/ {inventory?.totalVramGb || 0} GB</span>
                </div>
                <p className="text-xs text-muted-foreground">High-bandwidth GPU memory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  GPU Utilization
                </CardTitle>
                <Activity className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {inventory?.gpuUtilizationPct || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Active compute load</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  AI Model Instances
                </CardTitle>
                <Bot className="size-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workloads.length}</div>
                <p className="text-xs text-muted-foreground">LLMs, embeddings & fine-tuning</p>
              </CardContent>
            </Card>
          </div>

          {/* Physical GPU Hardware Nodes */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="size-4 text-primary" />
              GPU Hardware Nodes & Accelerators
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {cards.map((card, idx) => (
                <Card key={idx} className="bg-card/70 border-border/70">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <Cpu className="size-4 text-emerald-400" />
                          {card.model}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono">
                          Node: {card.nodeName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {card.count}x Cards ({card.vramPerCardGb * card.count}GB Total)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Allocated:</span>
                        <span className="font-semibold font-mono text-foreground">{card.allocatedGpus} / {card.count} GPUs</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] flex items-center gap-0.5">
                          <Thermometer className="size-2.5 text-amber-500" /> Temperature:
                        </span>
                        <span className="font-semibold font-mono text-foreground">{card.temperatureC}°C</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] flex items-center gap-0.5">
                          <Zap className="size-2.5 text-amber-500" /> Power Draw:
                        </span>
                        <span className="font-semibold font-mono text-foreground">{card.powerUsageW}W / {card.powerLimitW}W</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Active AI Workloads & Models Table */}
          <Card>
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bot className="size-4 text-primary" />
                    Active AI Model Deployments & Serving Runtimes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time token throughput, inference latency, and GPU footprint
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment & Model</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Task Type</TableHead>
                    <TableHead>GPUs Assigned</TableHead>
                    <TableHead>VRAM Used</TableHead>
                    <TableHead>Throughput / Latency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <RefreshCw className="size-5 animate-spin inline mr-2 text-primary" />
                        Scanning cluster for AI workloads...
                      </TableCell>
                    </TableRow>
                  ) : workloads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No active AI workloads detected
                      </TableCell>
                    </TableRow>
                  ) : (
                    workloads.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                            <Bot className="size-3.5 text-purple-400" />
                            {item.name}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[280px]">
                            {item.modelName}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={`text-[11px] font-semibold ${
                              item.framework === 'vLLM' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                              item.framework === 'Ollama' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}
                          >
                            {item.framework}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {item.taskType}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {item.gpusAllocated}x GPU
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {item.vramUsageGb} GB
                          </span>
                        </TableCell>

                        <TableCell>
                          {item.throughputTokensPerSec ? (
                            <div className="text-xs font-mono">
                              <span className="text-emerald-400 font-semibold">{item.throughputTokensPerSec} t/s</span>
                              <span className="text-muted-foreground text-[10px] ml-1.5">({item.p95LatencyMs}ms p95)</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Training sync</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="default"
                            className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* AI Runtime Environment Card */}
          {runtime && (
            <Card className="bg-muted/20 border-border/60">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">Cluster AI Environment:</span>
                  <span className="text-muted-foreground">NVIDIA Driver {runtime.driverVersion} • CUDA {runtime.cudaVersion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[11px]">
                    {runtime.gpuOperatorStatus}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
                    MIG Partitioning: {runtime.migMode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
