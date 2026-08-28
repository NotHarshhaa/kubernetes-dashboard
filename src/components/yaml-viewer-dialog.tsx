"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/contexts/toast-context"
import { FileCode2, Copy, Check, Download } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface YamlViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceKind: string
  resourceName: string
  namespace?: string
  rawYaml?: string
}

export function YamlViewerDialog({
  open,
  onOpenChange,
  resourceKind,
  resourceName,
  namespace = 'default',
  rawYaml
}: YamlViewerDialogProps) {
  const [yamlContent, setYamlContent] = useState<string>(rawYaml || '')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { success, error: showError } = useToast()

  useEffect(() => {
    if (rawYaml) {
      setYamlContent(rawYaml)
      return
    }

    if (open && resourceKind && resourceName) {
      setLoading(true)
      apiClient
        .getResourceYaml(resourceKind, resourceName, namespace)
        .then(yaml => setYamlContent(yaml))
        .catch(err => showError(`Failed to load manifest: ${err instanceof Error ? err.message : 'Error'}`))
        .finally(() => setLoading(false))
    }
  }, [open, resourceKind, resourceName, namespace, rawYaml, showError])

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent)
    setCopied(true)
    success('YAML manifest copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resourceKind.toLowerCase()}-${resourceName}.yaml`
    a.click()
    URL.revokeObjectURL(url)
    success('YAML file downloaded')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <FileCode2 className="h-5 w-5 text-blue-400" />
                <span>Resource Manifest:</span>
                <span className="font-mono text-blue-400">{resourceName}</span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 text-xs">
                  {resourceKind}
                </Badge>
                <span>Namespace: <strong className="text-slate-300">{namespace}</strong></span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700 rounded-lg"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 px-3 text-xs bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700 rounded-lg"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[360px] max-h-[55vh] mt-4 rounded-xl border border-slate-800/80 bg-black/60 p-4 font-mono text-xs overflow-hidden">
          <ScrollArea className="h-full w-full pr-3">
            <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed select-text font-mono">
              {yamlContent}
            </pre>
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
