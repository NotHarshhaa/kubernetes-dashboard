"use client";

import { ChevronDown, LogOut, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/utils";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const displayName = user?.name ?? "Cluster Admin";
  const displayEmail = user?.email ?? "admin@k8s.local";
  const roleLabel = user?.role === "admin" ? "Cluster Administrator" : "Operator";

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out — see you soon");
    router.replace("/auth/v2/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-muted/50 flex h-9 items-center gap-2 rounded-full border pr-1.5 pl-1 transition-colors"
        aria-label="Account menu"
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">{displayName}</span>
        <ChevronDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{displayName}</span>
              <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="gap-2" onClick={() => router.push("/dashboard/settings")}>
            <UserRound />
            Account
            <span className="text-muted-foreground ml-auto text-[10px] font-semibold tracking-wider uppercase">
              {roleLabel}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => router.push("/dashboard/settings")}>
            <Settings2 />
            Dashboard Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => router.push("/dashboard/security")}>
            <ShieldCheck />
            Security & CIS
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="gap-2" onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
