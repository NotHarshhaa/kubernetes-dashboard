"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()
  const { success, error: showError } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const signInSuccess = await signIn(email, password)
      if (signInSuccess) {
        success("Welcome back! Redirecting to cluster dashboard...")
        setTimeout(() => {
          router.push('/')
        }, 600)
      } else {
        showError("Invalid credentials. Try admin@k8s.local / admin123")
      }
    } catch (err) {
      showError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail("admin@k8s.local")
    setPassword("admin123")
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Subtle backdrop decoration */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-4 relative z-10">
        <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-md">
              <Shield className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Kubernetes Dashboard
            </CardTitle>
            <CardDescription className="text-xs">
              Authenticate with your operator credentials to access cluster management
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Operator Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@k8s.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9.5 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="•••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9.5 pr-9.5 h-9 text-xs"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 text-xs font-semibold shadow-xs"
              >
                {isLoading ? "Authenticating..." : "Sign In to Cluster"}
              </Button>
            </form>

            <Separator />

            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <span>Demo Environment Credentials:</span>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="inline-flex items-center gap-1 font-mono text-[11px] bg-muted/80 hover:bg-muted border border-border/60 rounded-lg px-2.5 py-1 text-foreground transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3 text-amber-500" />
                  admin@k8s.local / admin123 (Click to fill)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Protected by Kubernetes RBAC and Mutual TLS Authentication
        </p>
      </div>
    </div>
  )
}
