"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"
import { 
  Settings, 
  Monitor, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  RefreshCw,
  Save,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Zap,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  
  // General Settings
  const [clusterName, setClusterName] = useState("demo-cluster")
  const [refreshInterval, setRefreshInterval] = useState("30")
  const [timezone, setTimezone] = useState("UTC")
  const [languageSetting, setLanguageSetting] = useState(language)
  
  // Appearance Settings
  const [theme, setTheme] = useState("system")
  const [compactMode, setCompactMode] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [podAlerts, setPodAlerts] = useState(true)
  const [nodeAlerts, setNodeAlerts] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  
  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("24")
  const [apiAccessEnabled, setApiAccessEnabled] = useState(true)
  const [auditLogging, setAuditLogging] = useState(true)
  
  // Advanced Settings
  const [debugMode, setDebugMode] = useState(false)
  const [betaFeatures, setBetaFeatures] = useState(false)
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [metricsEnabled, setMetricsEnabled] = useState(true)
  
  // API Settings
  const [apiKey, setApiKey] = useState("k8s-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
  const [apiRateLimit, setApiRateLimit] = useState("1000")
  const [webhookUrl, setWebhookUrl] = useState("")
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [showApiKey, setShowApiKey] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('k8s-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      // Apply saved settings
      Object.keys(settings).forEach(key => {
        const setters: Record<string, (value: any) => void> = {
          clusterName: setClusterName,
          refreshInterval: setRefreshInterval,
          timezone: setTimezone,
          language: setLanguageSetting,
          theme: setTheme,
          compactMode: setCompactMode,
          animationsEnabled: setAnimationsEnabled,
          sidebarCollapsed: setSidebarCollapsed,
          emailNotifications: setEmailNotifications,
          pushNotifications: setPushNotifications,
          podAlerts: setPodAlerts,
          nodeAlerts: setNodeAlerts,
          securityAlerts: setSecurityAlerts,
          twoFactorAuth: setTwoFactorAuth,
          sessionTimeout: setSessionTimeout,
          apiAccessEnabled: setApiAccessEnabled,
          auditLogging: setAuditLogging,
          debugMode: setDebugMode,
          betaFeatures: setBetaFeatures,
          cacheEnabled: setCacheEnabled,
          metricsEnabled: setMetricsEnabled,
          apiKey: setApiKey,
          apiRateLimit: setApiRateLimit,
          webhookUrl: setWebhookUrl
        }
        if (setters[key]) {
          setters[key](settings[key])
        }
      })
    }
  }, [language]) // Add language dependency

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguageSetting(newLanguage as any)
    setLanguage(newLanguage as any)
  }

  const saveSettings = async () => {
    setSaveStatus("saving")
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const settings = {
      clusterName,
      refreshInterval,
      timezone,
      language: languageSetting,
      theme,
      compactMode,
      animationsEnabled,
      sidebarCollapsed,
      emailNotifications,
      pushNotifications,
      podAlerts,
      nodeAlerts,
      securityAlerts,
      twoFactorAuth,
      sessionTimeout,
      apiAccessEnabled,
      auditLogging,
      debugMode,
      betaFeatures,
      cacheEnabled,
      metricsEnabled,
      apiKey,
      apiRateLimit,
      webhookUrl
    }
    
    try {
      localStorage.setItem('k8s-settings', JSON.stringify(settings))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const resetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      localStorage.removeItem('k8s-settings')
      window.location.reload()
    }
  }

  const exportSettings = () => {
    const settings = {
      clusterName,
      refreshInterval,
      timezone,
      language,
      theme,
      compactMode,
      animationsEnabled,
      sidebarCollapsed,
      emailNotifications,
      pushNotifications,
      podAlerts,
      nodeAlerts,
      securityAlerts,
      twoFactorAuth,
      sessionTimeout,
      apiAccessEnabled,
      auditLogging,
      debugMode,
      betaFeatures,
      cacheEnabled,
      metricsEnabled,
      apiRateLimit,
      webhookUrl
    }
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'k8s-dashboard-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateNewApiKey = () => {
    const newKey = 'k8s-' + Math.random().toString(36).substring(2, 15) + '-' + 
                   Math.random().toString(36).substring(2, 15) + '-' +
                   Math.random().toString(36).substring(2, 15) + '-' +
                   Math.random().toString(36).substring(2, 15)
    setApiKey(newKey)
    setSaveStatus("idle")
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{t('settings.title')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{t('settings.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={exportSettings} className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                {t('settings.export')}
              </Button>
              <Button onClick={saveSettings} disabled={saveStatus === "saving"} className="rounded-xl">
                {saveStatus === "saving" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : saveStatus === "saved" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saveStatus === "saving" ? t('settings.saving') : saveStatus === "saved" ? t('settings.saved') : t('settings.saveChanges')}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                      <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>{t('settings.general')}</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t('settings.generalSubtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cluster-name">{t('settings.clusterName')}</Label>
                      <Input
                        id="cluster-name"
                        value={clusterName}
                        onChange={(e) => setClusterName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refresh-interval">{t('settings.refreshInterval')} ({t('settings.seconds')})</Label>
                      <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 {t('settings.seconds')}</SelectItem>
                          <SelectItem value="30">30 {t('settings.seconds')}</SelectItem>
                          <SelectItem value="60">1 {t('settings.minutes')}</SelectItem>
                          <SelectItem value="300">5 {t('settings.minutes')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">{t('settings.language')}</Label>
                      <Select value={languageSetting} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Español</SelectItem>
                          <SelectItem value="french">Français</SelectItem>
                          <SelectItem value="german">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Appearance Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                      <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Appearance</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Customize the look and feel of your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Theme</Label>
                        <p className="text-sm text-slate-500">Choose your preferred color scheme</p>
                      </div>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-32 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center space-x-2">
                              <Sun className="h-4 w-4" />
                              <span>Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center space-x-2">
                              <Moon className="h-4 w-4" />
                              <span>Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4" />
                              <span>System</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Compact Mode</Label>
                        <p className="text-sm text-slate-500">Reduce spacing and padding for more content</p>
                      </div>
                      <Switch
                        checked={compactMode}
                        onCheckedChange={setCompactMode}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Animations</Label>
                        <p className="text-sm text-slate-500">Enable smooth transitions and animations</p>
                      </div>
                      <Switch
                        checked={animationsEnabled}
                        onCheckedChange={setAnimationsEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Sidebar Collapsed</Label>
                        <p className="text-sm text-slate-500">Keep sidebar collapsed by default</p>
                      </div>
                      <Switch
                        checked={sidebarCollapsed}
                        onCheckedChange={setSidebarCollapsed}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                      <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage your alert and notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-slate-500">Receive alerts via email</p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Push Notifications</Label>
                        <p className="text-sm text-slate-500">Browser push notifications</p>
                      </div>
                      <Switch
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Pod Alerts</Label>
                        <p className="text-sm text-slate-500">Alert when pods fail or restart</p>
                      </div>
                      <Switch
                        checked={podAlerts}
                        onCheckedChange={setPodAlerts}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Node Alerts</Label>
                        <p className="text-sm text-slate-500">Alert when nodes go offline</p>
                      </div>
                      <Switch
                        checked={nodeAlerts}
                        onCheckedChange={setNodeAlerts}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Security Alerts</Label>
                        <p className="text-sm text-slate-500">Alert on security events</p>
                      </div>
                      <Switch
                        checked={securityAlerts}
                        onCheckedChange={setSecurityAlerts}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                      <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <span>Security</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Configure security and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-500">Add an extra layer of security</p>
                      </div>
                      <Switch
                        checked={twoFactorAuth}
                        onCheckedChange={setTwoFactorAuth}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                        <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="168">1 week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-rate-limit">API Rate Limit (requests/hour)</Label>
                        <Input
                          id="api-rate-limit"
                          value={apiRateLimit}
                          onChange={(e) => setApiRateLimit(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">API Access</Label>
                        <p className="text-sm text-slate-500">Enable external API access</p>
                      </div>
                      <Switch
                        checked={apiAccessEnabled}
                        onCheckedChange={setApiAccessEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Audit Logging</Label>
                        <p className="text-sm text-slate-500">Log all user actions</p>
                      </div>
                      <Switch
                        checked={auditLogging}
                        onCheckedChange={setAuditLogging}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* API Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Database className="h-5 w-5 text-orange-600" />
                    <span>API Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="rounded-xl flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="rounded-xl"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateNewApiKey}
                    className="w-full rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New Key
                  </Button>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-webhook-url.com"
                      className="rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Advanced Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <span>Advanced</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Debug Mode</Label>
                      <p className="text-xs text-slate-500">Enable debug logs</p>
                    </div>
                    <Switch
                      checked={debugMode}
                      onCheckedChange={setDebugMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Beta Features</Label>
                      <p className="text-xs text-slate-500">Try new features</p>
                    </div>
                    <Switch
                      checked={betaFeatures}
                      onCheckedChange={setBetaFeatures}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Cache Enabled</Label>
                      <p className="text-xs text-slate-500">Improve performance</p>
                    </div>
                    <Switch
                      checked={cacheEnabled}
                      onCheckedChange={setCacheEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Metrics Enabled</Label>
                      <p className="text-xs text-slate-500">Collect usage metrics</p>
                    </div>
                    <Switch
                      checked={metricsEnabled}
                      onCheckedChange={setMetricsEnabled}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl border-red-200 dark:border-red-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Danger Zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Reset all settings to their default values. This action cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      onClick={resetSettings}
                      className="w-full rounded-xl border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset All Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status */}
            {saveStatus !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex items-center space-x-2">
                  {saveStatus === "saving" && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                  {saveStatus === "saved" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {saveStatus === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <span className="text-sm font-medium">
                    {saveStatus === "saving" && "Saving settings..."}
                    {saveStatus === "saved" && "Settings saved successfully!"}
                    {saveStatus === "error" && "Failed to save settings"}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
