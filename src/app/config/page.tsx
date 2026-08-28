"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Database,
  Plus,
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

  // Filter items
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
      <div className="space-y-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Config & Secrets
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Manage ConfigMaps, environment configurations, and secure TLS / opaque secrets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin text-teal-500' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total ConfigMaps</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{configMaps.length}</div>
            <div className="text-xs text-teal-600 font-medium mt-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {configMaps.reduce((acc, c) => acc + Object.keys(c.data || {}).length, 0)} total keys
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Secrets</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{secrets.length}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Encrypted / Base64 encoded
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Namespaces</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{namespaces.length}</div>
            <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Across isolation zones
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TLS Certificates</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {secrets.filter(s => s.type.includes('tls')).length}
            </div>
            <div className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> TLS credentials configured
            </div>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by config or secret name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedNamespace}
              onChange={e => setSelectedNamespace(e.target.value)}
              className="px-4 py-2 h-10 rounded-xl text-sm font-medium border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
        <Tabs defaultValue="configmaps" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-72 p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur rounded-2xl">
            <TabsTrigger value="configmaps" className="rounded-xl py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              ConfigMaps ({filteredConfigMaps.length})
            </TabsTrigger>
            <TabsTrigger value="secrets" className="rounded-xl py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
              Secrets ({filteredSecrets.length})
            </TabsTrigger>
          </TabsList>

          {/* ConfigMaps Tab */}
          <TabsContent value="configmaps">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                      <TableRow key={`${c.namespace}-${c.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-slate-900 dark:text-white font-semibold">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{c.namespace}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {keys.map(k => (
                              <Badge key={k} variant="outline" className="text-xs font-mono bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                {k}
                              </Badge>
                            ))}
                            {keys.length === 0 && <span className="text-xs text-slate-400">Empty</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{c.age}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectItem({ open: true, kind: 'ConfigMap', name: c.name, namespace: c.namespace, data: c.data })}
                              className="h-8 text-xs rounded-lg text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30 border-teal-500/30"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Data
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setYamlDialog({ open: true, kind: 'ConfigMap', name: c.name, namespace: c.namespace })}
                              className="h-8 text-xs rounded-lg"
                            >
                              <FileCode2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete('ConfigMap', c.name, c.namespace)}
                              className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
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
                      <TableRow key={`${s.namespace}-${s.name}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-slate-900 dark:text-white font-semibold">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{s.namespace}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                            {s.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {keys.map(k => (
                              <Badge key={k} variant="outline" className="text-xs font-mono bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                {k}
                              </Badge>
                            ))}
                            {keys.length === 0 && <span className="text-xs text-slate-400">Empty</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{s.age}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectItem({ open: true, kind: 'Secret', name: s.name, namespace: s.namespace, data: s.data, type: s.type })}
                              className="h-8 text-xs rounded-lg text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 border-emerald-500/30"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Reveal Keys
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setYamlDialog({ open: true, kind: 'Secret', name: s.name, namespace: s.namespace })}
                              className="h-8 text-xs rounded-lg"
                            >
                              <FileCode2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete('Secret', s.name, s.namespace)}
                              className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-2xl">
            <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    {inspectItem.kind === 'Secret' ? <Lock className="h-5 w-5 text-emerald-500" /> : <FileText className="h-5 w-5 text-teal-500" />}
                    <span>{inspectItem.kind}:</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">{inspectItem.name}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-1">
                    Namespace: {inspectItem.namespace} {inspectItem.type && `• Type: ${inspectItem.type}`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden py-4 space-y-4">
              <div className="space-y-3">
                {Object.entries(inspectItem.data || {}).map(([key, val]) => {
                  const isSecret = inspectItem.kind === 'Secret'
                  const isRevealed = Boolean(revealedSecrets[key])
                  const displayValue = isSecret && !isRevealed ? '••••••••••••••••' : isSecret ? decodeBase64(val) : val

                  return (
                    <div key={key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {key}
                        </span>
                        <div className="flex items-center gap-2">
                          {isSecret && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleReveal(key)}
                              className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                              {isRevealed ? 'Hide' : 'Reveal'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyValue(key, val, isSecret)}
                            className="h-7 px-2 text-xs rounded-lg"
                          >
                            {copiedKey === key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-black/50 border border-slate-200/60 dark:border-slate-800 rounded-lg overflow-x-auto">
                        <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                          {displayValue}
                        </pre>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setInspectItem(prev => ({ ...prev, open: false }))} className="rounded-xl">
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
