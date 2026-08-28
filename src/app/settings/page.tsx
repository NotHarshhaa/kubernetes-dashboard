"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/contexts/toast-context"
import { 
  Settings, 
  Bell, 
  Shield, 
  Save, 
  Download, 
  RefreshCw, 
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react"

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const { success } = useToast()
  
  // General Settings
  const [clusterName, setClusterName] = useState("production-cluster")
  const [refreshInterval, setRefreshInterval] = useState("10")
  const [timezone, setTimezone] = useState("UTC")
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [podAlerts, setPodAlerts] = useState(true)
  const [nodeAlerts, setNodeAlerts] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  
  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState("24")
  const [auditLogging, setAuditLogging] = useState(true)
  
  // API Settings
  const [apiKey, setApiKey] = useState("k8s-prod-9a8f4c2e-88b1-419a")
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const saveSettings = () => {
    setSaveStatus("saving")
    setTimeout(() => {
      setSaveStatus("saved")
      success("Settings saved successfully")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, 500)
  }

  const exportSettings = () => {
    const data = {
      clusterName,
      refreshInterval,
      timezone,
      emailNotifications,
      podAlerts,
      nodeAlerts,
      securityAlerts,
      sessionTimeout,
      auditLogging
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'k8s-dashboard-settings.json'
    a.click()
    URL.revokeObjectURL(url)
    success("Settings exported")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Settings className="size-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('settings.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('settings.subtitle')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportSettings}>
              <Download className="size-3.5 mr-2" />
              {t('settings.export')}
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? (
                <RefreshCw className="size-3.5 mr-2 animate-spin" />
              ) : saveStatus === "saved" ? (
                <CheckCircle className="size-3.5 mr-2" />
              ) : (
                <Save className="size-3.5 mr-2" />
              )}
              {saveStatus === "saving" ? t('settings.saving') : saveStatus === "saved" ? t('settings.saved') : t('settings.saveChanges')}
            </Button>
          </div>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              {t('settings.general')}
            </CardTitle>
            <CardDescription>{t('settings.generalSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cluster-name" className="text-xs">{t('settings.clusterName')}</Label>
                <Input
                  id="cluster-name"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="refresh-interval" className="text-xs">{t('settings.refreshInterval')}</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger id="refresh-interval" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-xs">5 seconds (high rate)</SelectItem>
                    <SelectItem value="10" className="text-xs">10 seconds (standard)</SelectItem>
                    <SelectItem value="30" className="text-xs">30 seconds (low bandwidth)</SelectItem>
                    <SelectItem value="60" className="text-xs">1 minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs">{t('settings.timezone')}</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC" className="text-xs">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="EST" className="text-xs">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="PST" className="text-xs">PST (Pacific Standard Time)</SelectItem>
                    <SelectItem value="IST" className="text-xs">IST (India Standard Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="language" className="text-xs">Language</Label>
                <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                  <SelectTrigger id="language" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en" className="text-xs">English</SelectItem>
                    <SelectItem value="es" className="text-xs">Español</SelectItem>
                    <SelectItem value="fr" className="text-xs">Français</SelectItem>
                    <SelectItem value="de" className="text-xs">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              Notifications & Alerts
            </CardTitle>
            <CardDescription>Configure cluster event notifications and webhook triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Email Notifications</p>
                <p className="text-[11px] text-muted-foreground">Receive critical alerts via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Pod Failure Alerts</p>
                <p className="text-[11px] text-muted-foreground">Notify on CrashLoopBackOff or OOMKilled events</p>
              </div>
              <Switch checked={podAlerts} onCheckedChange={setPodAlerts} />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Node Memory Pressure</p>
                <p className="text-[11px] text-muted-foreground">Notify when node memory exceeds 85% threshold</p>
              </div>
              <Switch checked={nodeAlerts} onCheckedChange={setNodeAlerts} />
            </div>
          </CardContent>
        </Card>

        {/* Security & API Key */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Security & Access Tokens
            </CardTitle>
            <CardDescription>Session management and cluster API credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Cluster API Token</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="h-8 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Audit Logging</p>
                <p className="text-[11px] text-muted-foreground">Record API mutations and operator actions</p>
              </div>
              <Switch checked={auditLogging} onCheckedChange={setAuditLogging} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
