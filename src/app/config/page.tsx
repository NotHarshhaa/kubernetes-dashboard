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
    success(`Copied value for key ${key}`)
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
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Config & Secrets
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage ConfigMaps, environment configurations, and secure TLS / opaque secrets
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total ConfigMaps</span>
            <div className="text-2xl font-bold text-foreground mt-1">{configMaps.length}</div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {configMaps.reduce((acc, c) => acc + Object.keys(c.data || {}).length, 0)} total keys
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Secrets</span>
            <div className="text-2xl font-bold text-foreground mt-1">{secrets.length}</div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Base64 encrypted
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Namespaces</span>
            <div className="text-2xl font-bold text-foreground mt-1">{namespaces.length}</div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Isolation zones
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TLS Certificates</span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {secrets.filter(s => s.type.includes('tls')).length}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> TLS credentials
            </div>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border bg-card">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by config or secret name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedNamespace}
              onChange={e => setSelectedNamespace(e.target.value)}
              className="h-9 px-3 rounded-md text-sm border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
          <TabsList className="grid grid-cols-2 w-72 h-auto p-1">
            <TabsTrigger value="configmaps">
              ConfigMaps ({filteredConfigMaps.length})
            </TabsTrigger>
            <TabsTrigger value="secrets">
              Secrets ({filteredSecrets.length})
            </TabsTrigger>
          </TabsList>

          {/* ConfigMaps Tab */}
          <TabsContent value="configmaps">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ConfigMap Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Keys / Data Entries</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigMaps.map(c => {
                    const keys = Object.keys(c.data || {})
                    return (
                      <TableRow key={`${c.namespace}-${c.name}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{c.namespace}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {keys.map(k => (
                              <Badge key={k} variant="secondary" className="text-xs font-mono">
                                {k}
                              </Badge>
                            ))}
                            {keys.length === 0 && <span className="text-xs text-muted-foreground">Empty</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.age}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectItem({ open: true, kind: 'ConfigMap', name: c.name, namespace: c.namespace, data: c.data })}
                              className="h-8 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Data
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setYamlDialog({ open: true, kind: 'ConfigMap', name: c.name, namespace: c.namespace })}
                              className="h-8 w-8 p-0"
                            >
                              <FileCode2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete('ConfigMap', c.name, c.namespace)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secret Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Encrypted Keys</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSecrets.map(s => {
                    const keys = Object.keys(s.data || {})
                    return (
                      <TableRow key={`${s.namespace}-${s.name}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{s.namespace}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {s.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {keys.map(k => (
                              <Badge key={k} variant="secondary" className="text-xs font-mono">
                                {k}
                              </Badge>
                            ))}
                            {keys.length === 0 && <span className="text-xs text-muted-foreground">Empty</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.age}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectItem({ open: true, kind: 'Secret', name: s.name, namespace: s.namespace, data: s.data, type: s.type })}
                              className="h-8 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Reveal Keys
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setYamlDialog({ open: true, kind: 'Secret', name: s.name, namespace: s.namespace })}
                              className="h-8 w-8 p-0"
                            >
                              <FileCode2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete('Secret', s.name, s.namespace)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-base flex items-center gap-2">
                {inspectItem.kind === 'Secret' ? <Lock className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                <span>{inspectItem.kind}:</span>
                <span className="font-mono text-primary">{inspectItem.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Namespace: {inspectItem.namespace} {inspectItem.type && `• Type: ${inspectItem.type}`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {Object.entries(inspectItem.data || {}).map(([key, val]) => {
                const isSecret = inspectItem.kind === 'Secret'
                const isRevealed = Boolean(revealedSecrets[key])
                const displayValue = isSecret && !isRevealed ? '••••••••••••••••' : isSecret ? decodeBase64(val) : val

                return (
                  <div key={key} className="p-3 rounded-lg border bg-muted/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded">
                        {key}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSecret && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleReveal(key)}
                            className="h-7 px-2 text-xs"
                          >
                            {isRevealed ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                            {isRevealed ? 'Hide' : 'Reveal'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyValue(key, val, isSecret)}
                          className="h-7 px-2 text-xs"
                        >
                          {copiedKey === key ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-2.5 bg-background border rounded-md overflow-x-auto">
                      <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-all">
                        {displayValue}
                      </pre>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setInspectItem(prev => ({ ...prev, open: false }))}>
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
