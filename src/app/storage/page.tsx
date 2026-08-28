"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { apiClient, PersistentVolume, PersistentVolumeClaim, StorageClass } from "@/lib/api-client"
import { useToast } from "@/contexts/toast-context"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import { 
  HardDrive, 
  Database, 
  Layers, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  FileCode2, 
  Copy,
  Server,
  Zap
} from "lucide-react"

export default function StoragePage() {
  const [persistentVolumes, setPersistentVolumes] = useState<PersistentVolume[]>([])
  const [persistentVolumeClaims, setPersistentVolumeClaims] = useState<PersistentVolumeClaim[]>([])
  const [storageClasses, setStorageClasses] = useState<StorageClass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pvcs")

  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    kind: string
    name: string
    namespace: string
  }>({
    open: false,
    kind: 'PersistentVolumeClaim',
    name: '',
    namespace: 'default'
  })

  const { success, error: showError } = useToast()

  const fetchStorageData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getStorageData(selectedNamespace === 'all' ? undefined : selectedNamespace)
      setPersistentVolumes(data.persistentVolumes || [])
      setPersistentVolumeClaims(data.persistentVolumeClaims || [])
      setStorageClasses(data.storageClasses || [])
    } catch (err) {
      showError(`Failed to fetch storage data: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, showError])

  useEffect(() => {
    fetchStorageData()
  }, [fetchStorageData])

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    if (!confirm(`Are you sure you want to delete ${kind} ${name}?`)) return
    try {
      await apiClient.deleteResource(kind, name, namespace)
      success(`${kind} ${name} deleted successfully`)
      fetchStorageData()
    } catch (err) {
      showError(`Failed to delete ${kind}: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success("Copied to clipboard")
  }

  // Filtered lists
  const filteredPVCs = persistentVolumeClaims.filter(pvc =>
    pvc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pvc.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pvc.storageClass.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPVs = persistentVolumes.filter(pv =>
    pv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pv.storageClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pv.volumeType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredStorageClasses = storageClasses.filter(sc =>
    sc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sc.provisioner.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const namespaces = Array.from(new Set(persistentVolumeClaims.map(p => p.namespace)))

  const totalPvCapacity = persistentVolumes.reduce((acc, pv) => {
    const num = parseInt(pv.capacity) || 0
    return acc + num
  }, 0)

  const boundPvs = persistentVolumes.filter(p => p.status === 'Bound').length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <HardDrive className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Storage & Volumes</h1>
                  <p className="text-muted-foreground text-xs">Persistent Volumes, Claims (PVCs), StorageClasses, and CSI provisioner storage pools</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={fetchStorageData}>
                <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Volume Pool</CardTitle>
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <HardDrive className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">{totalPvCapacity} GiB</div>
                <p className="text-xs text-muted-foreground mt-1">{persistentVolumes.length} PersistentVolumes provisioned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active PVCs</CardTitle>
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <Database className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">{persistentVolumeClaims.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Bound to stateful workloads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PV Bound Status</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{boundPvs} / {persistentVolumes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Healthy attached volumes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">StorageClasses</CardTitle>
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                  <Layers className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono">{storageClasses.length}</div>
                <p className="text-xs text-muted-foreground mt-1">CSI dynamic provisioners</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search storage resources by name or class..."
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
          <Tabs defaultValue="pvcs" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-96 h-auto p-1">
              <TabsTrigger value="pvcs" className="font-semibold">
                Claims / PVCs ({filteredPVCs.length})
              </TabsTrigger>
              <TabsTrigger value="pvs" className="font-semibold">
                Volumes / PVs ({filteredPVs.length})
              </TabsTrigger>
              <TabsTrigger value="storageclasses" className="font-semibold">
                StorageClasses ({filteredStorageClasses.length})
              </TabsTrigger>
            </TabsList>

            {/* 1. PVCs Tab */}
            <TabsContent value="pvcs">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Name</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bound Volume</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>StorageClass</TableHead>
                      <TableHead>Access Modes</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPVCs.map(pvc => (
                      <TableRow key={`${pvc.namespace}-${pvc.name}`}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Database className="size-4 text-primary" />
                            <span className="font-mono text-xs">{pvc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{pvc.namespace}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={pvc.status === 'Bound' ? 'success' : 'warning'} className="text-xs font-semibold">
                            {pvc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{pvc.volume}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span>{pvc.usedCapacity || pvc.capacity} / {pvc.capacity}</span>
                            </div>
                            <Progress value={pvc.usedCapacity ? (parseFloat(pvc.usedCapacity) / parseFloat(pvc.capacity)) * 100 : 50} className="h-1.5 w-24" />
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="purple" className="text-[10px] font-mono">{pvc.storageClass}</Badge></TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{pvc.accessModes.join(', ')}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setYamlDialog({ open: true, kind: 'PersistentVolumeClaim', name: pvc.name, namespace: pvc.namespace })}
                              className="size-7.5 rounded-lg shadow-xs"
                              title="View YAML"
                            >
                              <FileCode2 className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDelete('PersistentVolumeClaim', pvc.name, pvc.namespace)}
                              className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Delete PVC"
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

            {/* 2. PVs Tab */}
            <TabsContent value="pvs">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volume Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Claim Ref</TableHead>
                      <TableHead>StorageClass</TableHead>
                      <TableHead>Volume Type</TableHead>
                      <TableHead>Reclaim Policy</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPVs.map(pv => (
                      <TableRow key={pv.name}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <HardDrive className="size-4 text-primary" />
                            <span className="font-mono text-xs">{pv.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold">{pv.capacity}</TableCell>
                        <TableCell>
                          <Badge variant={pv.status === 'Bound' ? 'success' : 'secondary'} className="text-xs">
                            {pv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{pv.claim}</TableCell>
                        <TableCell><Badge variant="purple" className="text-[10px] font-mono">{pv.storageClass}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{pv.volumeType}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{pv.reclaimPolicy}</Badge></TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setYamlDialog({ open: true, kind: 'PersistentVolume', name: pv.name, namespace: '' })}
                              className="size-7.5 rounded-lg shadow-xs"
                              title="View YAML"
                            >
                              <FileCode2 className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDelete('PersistentVolume', pv.name, '')}
                              className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Delete PV"
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

            {/* 3. StorageClasses Tab */}
            <TabsContent value="storageclasses">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Provisioner</TableHead>
                      <TableHead>Reclaim Policy</TableHead>
                      <TableHead>Volume Expansion</TableHead>
                      <TableHead>Binding Mode</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStorageClasses.map(sc => (
                      <TableRow key={sc.name}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Layers className="size-4 text-violet-500" />
                            <span className="font-mono text-xs">{sc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{sc.provisioner}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{sc.reclaimPolicy}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={sc.allowVolumeExpansion ? 'success' : 'secondary'} className="text-[10px]">
                            {sc.allowVolumeExpansion ? 'Supported' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{sc.volumeBindingMode}</TableCell>
                        <TableCell>
                          {sc.isDefault ? (
                            <Badge variant="success" className="text-[10px]">Default Class</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setYamlDialog({ open: true, kind: 'StorageClass', name: sc.name, namespace: '' })}
                            className="size-7.5 rounded-lg shadow-xs"
                            title="View YAML"
                          >
                            <FileCode2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>

          {/* YAML Dialog */}
          <YamlViewerDialog
            open={yamlDialog.open}
            onOpenChange={open => setYamlDialog(prev => ({ ...prev, open }))}
            resourceKind={yamlDialog.kind}
            resourceName={yamlDialog.name}
            namespace={yamlDialog.namespace}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
