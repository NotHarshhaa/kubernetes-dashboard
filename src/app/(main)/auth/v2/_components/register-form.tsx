"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Eye, EyeOff, KeyRound, Loader2, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp, isAuthenticated } = useAuth();

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard/overview");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const success = await signUp(name, email, password);
      if (success) {
        toast.success("Account created. Welcome to the cluster!");
        router.replace("/dashboard/overview");
      }
    } catch {
      toast.error("Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordChecks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Upper & lowercase", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", ok: /\d/.test(password) },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Create your account</CardTitle>
        <CardDescription>Register an operator account to manage your clusters</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-name" className="text-xs font-medium">
              Full Name
            </Label>
            <div className="relative">
              <UserRound className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="register-name"
                type="text"
                required
                placeholder="Jane Operator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 pl-9 text-sm"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-email" className="text-xs font-medium">
              Operator Email
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="register-email"
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 pl-9 text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-password" className="text-xs font-medium">
              Password
            </Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pr-9 pl-9 text-sm"
                autoComplete="new-password"
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
            {password.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {passwordChecks.map((check) => (
                  <span
                    key={check.label}
                    className={
                      check.ok
                        ? "border-emerald-500/30 bg-emerald-500/5 rounded border px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium"
                    }
                  >
                    {check.ok ? "✓ " : ""}
                    {check.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-confirm" className="text-xs font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="register-confirm"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9 pl-9 text-sm"
                autoComplete="new-password"
              />
            </div>
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Passwords do not match</span>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="h-9 w-full text-sm font-semibold">
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <Separator />

        <p className="text-muted-foreground text-center text-xs">
          Already have an account?{" "}
          <Link href="/auth/v2/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
