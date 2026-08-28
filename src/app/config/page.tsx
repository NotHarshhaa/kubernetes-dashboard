"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/contexts/toast-context"
import { apiClient, ConfigMap, Secret } from "@/lib/api-client"
import { YamlViewerDialog } from "@/components/yaml-viewer-dialog"
import {
  KeyRound,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  RefreshCw,
  Trash2,
  FileCode2,
  Shield,
  Layers
} from "lucide-react"

export default function ConfigPage() {
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([])
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("configmaps")

  // Inspect Modal State
  const [inspectItem, setInspectItem] = useState<{
    open: boolean
    kind: 'ConfigMap' | 'Secret'
    name: string
    namespace: string
    data: Record<string, string>
    type?: string
  }>({
    open: false,
    kind: 'ConfigMap',
    name: '',
    namespace: 'default',
    data: {}
  })

  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [yamlDialog, setYamlDialog] = useState<{
    open: boolean
    kind: string
    name: string
    namespace: string
  }>({
    open: false,
    kind: 'ConfigMap',
    name: '',
    namespace: 'default'
  })

  const { success, error: showError } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [cmList, secList] = await Promise.all([
        apiClient.getConfigMaps(selectedNamespace === 'all' ? undefined : selectedNamespace),
        apiClient.getSecrets(selectedNamespace === 'all' ? undefined : selectedNamespace)
      ])
      setConfigMaps(cmList)
      setSecrets(secList)
    } catch (err) {
      showError(`Failed to fetch config data: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setLoading(false)
    }
  }, [selectedNamespace, showError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (kind: string, name: string, namespace: string) => {
    if (!confirm(`Are you sure you want to delete ${kind} ${name}?`)) return
    try {
      await apiClient.deleteResource(kind, name, namespace)
      success(`${kind} ${name} deleted successfully`)
      fetchData()
    } catch (err) {
      showError(`Delete failed: ${err instanceof Error ? err.message : 'Error'}`)
    }
  }

  const decodeBase64 = (val: string) => {
    try {
      return atob(val)
    } catch {
      return val
    }
  }

  const handleCopyValue = (key: string, val: string, isSecret: boolean) => {
    const textToCopy = isSecret ? decodeBase64(val) : val
    navigator.clipboard.writeText(textToCopy)
    setCopiedKey(key)
    success(`Copied value for key: ${key}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleReveal = (key: string) => {
    setRevealedSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filterList = <T extends { name: string; namespace: string }>(list: T[]) => {
    return list.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namespace.toLowerCase().includes(searchTerm.toLowerCase())
      return matchSearch
    })
  }

  const filteredConfigMaps = filterList(configMaps)
  const filteredSecrets = filterList(secrets)

  const namespaces = Array.from(
    new Set([...configMaps.map(c => c.namespace), ...secrets.map(s => s.namespace)])
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Config & Secrets
                </h1>
                <p className="text-muted-foreground text-xs">
                  Application configuration profiles, environment ConfigMaps, and encrypted TLS / opaque Secret storage
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={fetchData}
            >
              <RefreshCw className={`size-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total ConfigMaps</CardTitle>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <FileText className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{configMaps.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {configMaps.reduce((acc, c) => acc + Object.keys(c.data || {}).length, 0)} total key values
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Secrets</CardTitle>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <Shield className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{secrets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Base64 encrypted vault</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Namespaces</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Layers className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground font-mono">{namespaces.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Isolation partitions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TLS Certificates</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Lock className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {secrets.filter(s => s.type.includes('tls')).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">TLS security keys</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by config or secret name..."
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

        {/* Tabs for ConfigMaps & Secrets */}
        <Tabs defaultValue="configmaps" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-80 h-auto p-1">
            <TabsTrigger value="configmaps" className="font-semibold">
              ConfigMaps ({filteredConfigMaps.length})
            </TabsTrigger>
            <TabsTrigger value="secrets" className="font-semibold">
              Secrets ({filteredSecrets.length})
            </TabsTrigger>
          </TabsList>

          {/* ConfigMaps Tab */}
          <TabsContent value="configmaps">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ConfigMap Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Keys / Data Entries</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigMaps.map(c => {
                    const keys = Object.keys(c.data || {})
                    return (
                      <TableRow key={`${c.namespace}-${c.name}`}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{c.namespace}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {keys.map(k => (
                              <Badge key={k} variant="secondary" className="text-[10px] font-mono">
                                {k}
                              </Badge>
                            ))}
                            {keys.length === 0 && <span className="text-xs text-muted-foreground">Empty</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.age}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectItem({ open: true, kind: 'ConfigMap', name: c.name, namespace: c.namespace, data: c.data })}
                              className="h-7.5 text-xs shadow-xs"
                            >
                              <Eye className="size-3.5 mr-1" /> View Data
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setYamlDialog({ open: true, kind: 'ConfigMap', name: c.name, namespace: c.namespace })}
                              className="size-7.5 rounded-lg"
                              title="View YAML"
                            >
                              <FileCode2 className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDelete('ConfigMap', c.name, c.namespace)}
                              className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Delete ConfigMap"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Secrets Tab */}
          <TabsContent value="secrets">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secret Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Encrypted Keys</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSecrets.map(s => {
                    const keys = Object.keys(s.data || {})
                    return (
                      <TableRow key={`${s.namespace}-${s.name}`}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Lock className="size-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{s.namespace}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="purple" className="text-[10px] font-mono">
                            {s.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {keys.map(k => (
                              <Badge key={k} variant="secondary" className="text-[10px] font-mono">
                                {k}
                              </Badge>
                            ))}
                            {keys.length === 0 && <span className="text-xs text-muted-foreground">Empty</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.age}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectItem({ open: true, kind: 'Secret', name: s.name, namespace: s.namespace, data: s.data, type: s.type })}
                              className="h-7.5 text-xs shadow-xs"
                            >
                              <Eye className="size-3.5 mr-1" /> Reveal Keys
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setYamlDialog({ open: true, kind: 'Secret', name: s.name, namespace: s.namespace })}
                              className="size-7.5 rounded-lg"
                              title="View YAML"
                            >
                              <FileCode2 className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDelete('Secret', s.name, s.namespace)}
                              className="size-7.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Delete Secret"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Inspect Key-Value Dialog */}
        <Dialog open={inspectItem.open} onOpenChange={open => setInspectItem(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {inspectItem.kind === 'Secret' ? <Lock className="size-4.5 text-violet-500" /> : <FileText className="size-4.5 text-primary" />}
                <span>{inspectItem.kind}:</span>
                <span className="font-mono text-primary">{inspectItem.name}</span>
              </DialogTitle>
              <DialogDescription>
                Namespace: <span className="font-mono">{inspectItem.namespace}</span> {inspectItem.type && `• Type: ${inspectItem.type}`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-2 space-y-3">
              {Object.entries(inspectItem.data || {}).map(([key, val]) => {
                const isSecret = inspectItem.kind === 'Secret'
                const isRevealed = Boolean(revealedSecrets[key])
                const displayValue = isSecret && !isRevealed ? '••••••••••••••••••••••••••••' : isSecret ? decodeBase64(val) : val

                return (
                  <div key={key} className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded-md border border-border/50">
                        {key}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSecret && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => toggleReveal(key)}
                          >
                            {isRevealed ? <EyeOff className="size-3 mr-1" /> : <Eye className="size-3 mr-1" />}
                            {isRevealed ? 'Hide' : 'Reveal'}
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleCopyValue(key, val, isSecret)}
                          className="shadow-xs"
                        >
                          {copiedKey === key ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-background border border-border/60 rounded-lg overflow-x-auto">
                      <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-all">
                        {displayValue}
                      </pre>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setInspectItem(prev => ({ ...prev, open: false }))}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
  )
}
