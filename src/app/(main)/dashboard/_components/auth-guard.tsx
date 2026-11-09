"use client";

import { Loader2 } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/auth/v2/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="text-primary size-6 animate-spin" />
        <span className="text-xs">{loading ? "Checking session..." : "Redirecting to sign in..."}</span>
      </div>
    );
  }

  return <>{children}</>;
}
