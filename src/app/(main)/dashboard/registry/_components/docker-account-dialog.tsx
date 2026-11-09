"use client";

import { Check, ExternalLink, Key, Loader2, LogOut, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { clearStoredDockerAccount, type DockerAccount, saveStoredDockerAccount } from "@/lib/docker-registry";

interface DockerAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: DockerAccount | null;
  onAccountChange: (account: DockerAccount | null) => void;
}

export function DockerAccountDialog({ open, onOpenChange, account, onAccountChange }: DockerAccountDialogProps) {
  const [username, setUsername] = useState(account?.username || "");
  const [tokenOrPassword, setTokenOrPassword] = useState(account?.token || "");
  const [registryUrl, setRegistryUrl] = useState(account?.registryUrl || "https://index.docker.io/v1/");
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !tokenOrPassword.trim()) {
      toast.error("Please enter your Docker Hub username and access token.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.authenticateDockerRegistry(username, tokenOrPassword, registryUrl);
      if (res.success) {
        const newAccount: DockerAccount = {
          username: res.username || username,
          token: res.token || tokenOrPassword,
          registryUrl: res.registryUrl || registryUrl,
          isConnected: true,
          connectedAt: res.connectedAt || new Date().toISOString(),
        };
        saveStoredDockerAccount(newAccount);
        onAccountChange(newAccount);
        toast.success(res.message);
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to authenticate with Docker Hub");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearStoredDockerAccount();
    onAccountChange(null);
    setUsername("");
    setTokenOrPassword("");
    toast.info("Docker account disconnected");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Docker & Registry Account</DialogTitle>
              <DialogDescription>
                Connect your Docker Hub account to search private repositories and pull images with ImagePullSecrets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {account?.isConnected ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 font-semibold">
                    {account.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">@{account.username}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        <Check className="mr-1 h-3 w-3" /> Connected
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{account.registryUrl || "Docker Hub"}</p>
                  </div>
                </div>
              </div>
              {account.connectedAt && (
                <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t">
                  Authenticated on: {new Date(account.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Your Kubernetes cluster can now pull private images using automated secret injection.</p>
              <p>• You can filter and view your personal repositories under &quot;My Repositories&quot;.</p>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button type="button" variant="destructive" onClick={handleDisconnect}>
                <LogOut className="mr-2 h-4 w-4" /> Disconnect Account
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="docker-username" className="text-xs font-medium">
                Docker Hub Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="docker-username"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="docker-token" className="text-xs font-medium">
                  Personal Access Token (or Password)
                </Label>
                <a
                  href="https://app.docker.com/settings/personal-access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[11px] text-primary hover:underline"
                >
                  Create token <ExternalLink className="ml-1 h-2.5 w-2.5" />
                </a>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="docker-token"
                  type="password"
                  placeholder="dckr_pat_..."
                  value={tokenOrPassword}
                  onChange={(e) => setTokenOrPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We recommend creating a Personal Access Token with &quot;Read-only&quot; or &quot;Public Read&quot;
                scope on Docker Hub.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registry-url" className="text-xs font-medium">
                Registry Endpoint
              </Label>
              <Input
                id="registry-url"
                value={registryUrl}
                onChange={(e) => setRegistryUrl(e.target.value)}
                placeholder="https://index.docker.io/v1/"
                className="text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Connect Docker Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
