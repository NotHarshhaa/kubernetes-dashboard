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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-primary" />
                <span>Resource Manifest:</span>
                <span className="font-mono text-primary">{resourceName}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[11px] h-4 px-1.5">
                  {resourceKind}
                </Badge>
                <span>Namespace: <strong className="text-foreground">{namespace}</strong></span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2.5 text-xs"
              >
                {copied ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 px-2.5 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[320px] max-h-[50vh] mt-2 rounded-lg border bg-muted/40 p-3 font-mono text-xs overflow-hidden">
          <ScrollArea className="h-full w-full pr-2">
            <pre className="text-foreground whitespace-pre-wrap leading-relaxed select-text font-mono">
              {yamlContent}
            </pre>
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-7"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
