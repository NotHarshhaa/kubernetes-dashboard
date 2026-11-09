"use client";

import { Container, HardDrive, Layers, RefreshCw, Rocket, Search, Server, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { type DockerAccount, type DockerHubRepository, getStoredDockerAccount } from "@/lib/docker-registry";

import { DeployImageDialog } from "./deploy-image-dialog";
import { DockerAccountDialog } from "./docker-account-dialog";
import { ImageCard } from "./image-card";

const CATEGORIES = [
  "All",
  "Official Images",
  "Databases",
  "Web Servers",
  "Languages & Runtimes",
  "Monitoring & Tools",
  "Base OS",
];

export function RegistryView() {
  const [images, setImages] = useState<DockerHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterType, setFilterType] = useState<"all" | "official" | "community" | "mine">("all");
  const [matchedNamespace, setMatchedNamespace] = useState<string | null>(null);

  const [dockerAccount, setDockerAccount] = useState<DockerAccount | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedImageForDeploy, setSelectedImageForDeploy] = useState<DockerHubRepository | null>(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);

  // Cluster info for context
  const [clusterName, setClusterName] = useState("docker-desktop");

  useEffect(() => {
    setDockerAccount(getStoredDockerAccount());
    apiClient
      .getClusterInfo()
      .then((info) => {
        if (info.name) setClusterName(info.name);
      })
      .catch(() => {});
  }, []);

  const fetchImages = useCallback(
    async (query: string, category: string, filter: string) => {
      try {
        setIsSearching(true);
        const catParam = category === "All" || category === "Official Images" ? undefined : category;
        const effectiveFilter = query.trim() ? "all" : category === "Official Images" ? "official" : filter;

        const res = await apiClient.searchRegistry(query, effectiveFilter, catParam, dockerAccount);
        setImages(res.results);
        setMatchedNamespace(res.matchedNamespace || null);
      } catch (err) {
        toast.error(`Failed to load registry images: ${err instanceof Error ? err.message : "Network error"}`);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [dockerAccount],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchImages(searchQuery, selectedCategory, filterType);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, filterType, fetchImages]);

  const handleOpenDeploy = (image: DockerHubRepository) => {
    setSelectedImageForDeploy(image);
    setDeployDialogOpen(true);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "Official Images") {
      setFilterType("official");
    } else if (filterType === "official") {
      setFilterType("all");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Image Registry & Docker Hub</h1>
            <Badge variant="secondary" className="text-xs">
              Hub Integration
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search Docker Hub, inspect multi-arch tags, and deploy container images directly to your Kubernetes cluster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={dockerAccount?.isConnected ? "outline" : "default"}
            size="sm"
            onClick={() => setAccountDialogOpen(true)}
            className="text-xs gap-1.5"
          >
            {dockerAccount?.isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>@{dockerAccount.username}</span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5" />
                <span>Connect Docker Account</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchImages(searchQuery, selectedCategory, filterType)}
            disabled={isSearching}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSearching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registry Status</p>
            <p className="text-sm font-semibold">
              {dockerAccount?.isConnected ? `@${dockerAccount.username}` : "Public Docker Hub"}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {dockerAccount?.isConnected ? "Private Repos Enabled" : "Anonymous Rate Limit"}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target Cluster</p>
            <p className="text-sm font-semibold font-mono">{clusterName}</p>
            <span className="text-[10px] text-muted-foreground">Live Control Plane</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deploy Pipeline</p>
            <p className="text-sm font-semibold">Native K8s API</p>
            <span className="text-[10px] text-muted-foreground">Deployments & Pods</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Indexed Images</p>
            <p className="text-sm font-semibold">{images.length} available</p>
            <span className="text-[10px] text-muted-foreground">Live Docker Hub v2</span>
          </div>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images or Docker username (e.g. harshhaareddy, bitnami, nginx, redis)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 text-xs h-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Select
              value={filterType}
              onValueChange={(val: "all" | "official" | "community" | "mine") => setFilterType(val)}
            >
              <SelectTrigger className="w-[150px] text-xs h-9">
                <SelectValue placeholder="Filter Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Sources
                </SelectItem>
                <SelectItem value="official" className="text-xs">
                  Official Images
                </SelectItem>
                <SelectItem value="community" className="text-xs">
                  Community Images
                </SelectItem>
                {dockerAccount?.isConnected && (
                  <SelectItem value="mine" className="text-xs">
                    My Repositories
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors font-medium border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
                }`}
              >
                {cat}
              </button>
            );
          })}
          {dockerAccount?.isConnected && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("My Repositories");
                setFilterType("mine");
              }}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors font-medium border ${
                filterType === "mine"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
              }`}
            >
              My Repositories ({dockerAccount.username})
            </button>
          )}
        </div>
      </div>

      {/* Namespace Match Indicator */}
      {matchedNamespace && searchQuery.trim() && (
        <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>
              Showing container repositories published by Docker user/organization: <strong>@{matchedNamespace}</strong>
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/20 text-blue-600">
            {images.length} repositories
          </Badge>
        </div>
      )}

      {/* Main Image Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4 h-[200px] animate-pulse bg-muted/30 border-dashed" />
          ))}
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <ImageCard key={img.repoName} image={img} onDeploy={handleOpenDeploy} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Container className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">No container images found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No matching repositories found on Docker Hub for &quot;{searchQuery}&quot;. Try adjusting your search
                term or check the Official Images filter.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setFilterType("all");
              }}
              className="text-xs mt-2"
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Modals */}
      <DockerAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        account={dockerAccount}
        onAccountChange={(acc) => {
          setDockerAccount(acc);
          void fetchImages(searchQuery, selectedCategory, filterType);
        }}
      />

      <DeployImageDialog
        open={deployDialogOpen}
        onOpenChange={setDeployDialogOpen}
        image={selectedImageForDeploy}
        dockerAccount={dockerAccount}
        onDeployed={() => {
          // Deployment successful
        }}
      />
    </div>
  );
}
