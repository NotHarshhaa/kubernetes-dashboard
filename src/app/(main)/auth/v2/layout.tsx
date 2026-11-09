import { Activity, ShieldCheck, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";

import { AppLogo } from "@/components/app-logo";
import { APP_CONFIG } from "@/config/app-config";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 lg:flex">
        <div className="pointer-events-none absolute -top-48 -left-48 size-[480px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 -bottom-48 size-[480px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />

        <div className="relative z-10 flex items-center gap-2.5">
          <AppLogo className="size-8" />
          <span className="text-lg font-semibold tracking-tight">{APP_CONFIG.name}</span>
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="max-w-md text-3xl leading-tight font-bold tracking-tight">
              Your clusters, one command center.
            </h1>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Sign in to manage workloads, inspect live telemetry, stream pod logs and open ANSI terminal sessions —
              across every kubeconfig context you operate.
            </p>
          </div>

          <ul className="flex flex-col gap-3.5">
            {[
              { icon: Activity, title: "Real-time telemetry", desc: "CPU, memory and pod health across the fleet" },
              { icon: ShieldCheck, title: "Security & CIS audits", desc: "Findings with remediation guidance" },
              { icon: SquareTerminal, title: "Web terminal", desc: "ANSI xterm.js exec into any container" },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{title}</span>
                  <span className="text-muted-foreground text-xs">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground relative z-10 text-xs">{APP_CONFIG.copyright}</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
