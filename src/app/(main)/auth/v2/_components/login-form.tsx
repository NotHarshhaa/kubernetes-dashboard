"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Eye, EyeOff, KeyRound, Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated } = useAuth();

  const nextPath = searchParams.get("next") || "/dashboard/overview";

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, router, nextPath]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await signIn(email, password);
      if (success) {
        toast.success("Welcome back! Redirecting to the cluster dashboard...");
        router.replace(nextPath);
      } else {
        toast.error("Invalid credentials. Try admin@k8s.local / admin123");
      }
    } catch {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@k8s.local");
    setPassword("admin123");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>Sign in with your operator credentials to access the dashboard</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email" className="text-xs font-medium">
              Operator Email
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="login-email"
                type="email"
                required
                placeholder="admin@k8s.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 pl-9 text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password" className="text-xs font-medium">
              Password
            </Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pr-9 pl-9 text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="h-9 w-full text-sm font-semibold">
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <div className="flex min-w-0 flex-col gap-1 text-xs">
            <span className="text-muted-foreground leading-snug">
              Demo access — <span className="text-foreground font-mono">admin@k8s.local</span> /{" "}
              <span className="text-foreground font-mono">admin123</span>
            </span>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-primary w-fit font-semibold hover:underline"
            >
              Fill demo credentials
            </button>
          </div>
        </div>

        <Separator />

        <p className="text-muted-foreground text-center text-xs">
          Need an account?{" "}
          <Link href="/auth/v2/register" className="text-primary font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
