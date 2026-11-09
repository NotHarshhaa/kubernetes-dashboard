// GitOps ArgoCD & Flux Hub Management Engine

export type GitOpsEngine = "argocd" | "flux" | "all";
export type GitOpsSyncStatus = "Synced" | "OutOfSync" | "Unknown";
export type GitOpsHealthStatus = "Healthy" | "Progressing" | "Degraded" | "Suspended" | "Missing";

export interface GitOpsResourceDrift {
  kind: string;
  name: string;
  namespace: string;
  diffField: string;
  gitDeclared: string;
  liveCluster: string;
}

export interface GitOpsApp {
  id: string;
  name: string;
  namespace: string;
  engine: "argocd" | "flux";
  kind: "Application" | "ApplicationSet" | "Kustomization" | "GitRepository" | "HelmRelease";
  repoUrl: string;
  targetRevision: string;
  currentRevision: string;
  path: string;
  syncStatus: GitOpsSyncStatus;
  healthStatus: GitOpsHealthStatus;
  lastSyncedAt: string;
  syncPolicy: "Automated (Prune + SelfHeal)" | "Manual" | "Suspended";
  reconcileInterval: string;
  managedResourcesCount: number;
  drifts: GitOpsResourceDrift[];
}

export interface GitOpsSyncHistoryItem {
  id: string;
  appName: string;
  revision: string;
  commitMessage: string;
  author: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED";
}

export interface GitOpsSummary {
  totalApps: number;
  syncedCount: number;
  outOfSyncCount: number;
  healthyCount: number;
  degradedCount: number;
  argoAppsCount: number;
  fluxKustomizationsCount: number;
  driftCount: number;
  lastReconciliation: string;
}

export interface GitOpsData {
  summary: GitOpsSummary;
  apps: GitOpsApp[];
  syncHistory: GitOpsSyncHistoryItem[];
}

export const INITIAL_GITOPS_APPS: GitOpsApp[] = [
  {
    id: "argo-payment-service",
    name: "payment-platform",
    namespace: "argocd",
    engine: "argocd",
    kind: "Application",
    repoUrl: "https://github.com/enterprise/k8s-gitops-infra.git",
    targetRevision: "main",
    currentRevision: "a9c2f10",
    path: "apps/production/payment-service",
    syncStatus: "OutOfSync",
    healthStatus: "Progressing",
    lastSyncedAt: "12 minutes ago",
    syncPolicy: "Automated (Prune + SelfHeal)",
    reconcileInterval: "3m",
    managedResourcesCount: 14,
    drifts: [
      {
        kind: "Deployment",
        name: "payment-api",
        namespace: "production",
        diffField: "spec.replicas",
        gitDeclared: "3 replicas",
        liveCluster: "5 replicas (modified via HPA/manual scale)",
      },
      {
        kind: "ConfigMap",
        name: "payment-config",
        namespace: "production",
        diffField: "data.GATEWAY_TIMEOUT",
        gitDeclared: "10000ms",
        liveCluster: "15000ms",
      },
    ],
  },
  {
    id: "argo-ingress-nginx",
    name: "ingress-controller",
    namespace: "argocd",
    engine: "argocd",
    kind: "Application",
    repoUrl: "https://github.com/enterprise/k8s-gitops-infra.git",
    targetRevision: "main",
    currentRevision: "c44b89e",
    path: "infrastructure/ingress-nginx",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    lastSyncedAt: "4 minutes ago",
    syncPolicy: "Automated (Prune + SelfHeal)",
    reconcileInterval: "5m",
    managedResourcesCount: 8,
    drifts: [],
  },
  {
    id: "flux-cert-manager",
    name: "cert-manager-stack",
    namespace: "flux-system",
    engine: "flux",
    kind: "Kustomization",
    repoUrl: "https://github.com/enterprise/flux-fleet-infra.git",
    targetRevision: "v1.14.0",
    currentRevision: "v1.14.0@sha1:7bf01c2",
    path: "clusters/production/cert-manager",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    lastSyncedAt: "1 minute ago",
    syncPolicy: "Automated (Prune + SelfHeal)",
    reconcileInterval: "10m",
    managedResourcesCount: 19,
    drifts: [],
  },
  {
    id: "flux-monitoring-telemetry",
    name: "prometheus-telemetry",
    namespace: "flux-system",
    engine: "flux",
    kind: "HelmRelease",
    repoUrl: "https://github.com/enterprise/flux-fleet-infra.git",
    targetRevision: "main",
    currentRevision: "b1092df",
    path: "clusters/production/monitoring",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    lastSyncedAt: "8 minutes ago",
    syncPolicy: "Automated (Prune + SelfHeal)",
    reconcileInterval: "5m",
    managedResourcesCount: 32,
    drifts: [],
  },
  {
    id: "argo-ai-inference",
    name: "vllm-inference-pool",
    namespace: "argocd",
    engine: "argocd",
    kind: "Application",
    repoUrl: "https://github.com/enterprise/ai-platform-gitops.git",
    targetRevision: "release/v2.1",
    currentRevision: "8f7e21a",
    path: "manifests/vllm-serving",
    syncStatus: "OutOfSync",
    healthStatus: "Degraded",
    lastSyncedAt: "25 minutes ago",
    syncPolicy: "Manual",
    reconcileInterval: "Manual",
    managedResourcesCount: 6,
    drifts: [
      {
        kind: "Deployment",
        name: "vllm-serving",
        namespace: "ai-research",
        diffField: "spec.template.spec.containers[0].resources.limits.nvidia.com/gpu",
        gitDeclared: "1 GPU (NVIDIA A10G)",
        liveCluster: "2 GPUs (manually patched)",
      },
    ],
  },
  {
    id: "flux-security-policies",
    name: "kyverno-policy-suite",
    namespace: "flux-system",
    engine: "flux",
    kind: "Kustomization",
    repoUrl: "https://github.com/enterprise/flux-fleet-infra.git",
    targetRevision: "main",
    currentRevision: "4de721c",
    path: "policies/cis-benchmarks",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    lastSyncedAt: "3 minutes ago",
    syncPolicy: "Automated (Prune + SelfHeal)",
    reconcileInterval: "15m",
    managedResourcesCount: 22,
    drifts: [],
  },
];

export const INITIAL_SYNC_HISTORY: GitOpsSyncHistoryItem[] = [
  {
    id: "sync-hist-1",
    appName: "payment-platform",
    revision: "a9c2f10",
    commitMessage: "feat(payment): bump gateway client timeout to 10s and add rate limiting",
    author: "Alex Morgan <alex@devops.corp>",
    timestamp: "12 minutes ago",
    status: "SUCCESS",
  },
  {
    id: "sync-hist-2",
    appName: "cert-manager-stack",
    revision: "7bf01c2",
    commitMessage: "chore: rotate Let's Encrypt production ClusterIssuer credentials",
    author: "SRE Bot <automation@k8s.io>",
    timestamp: "45 minutes ago",
    status: "SUCCESS",
  },
  {
    id: "sync-hist-3",
    appName: "vllm-inference-pool",
    revision: "8f7e21a",
    commitMessage: "perf(vllm): configure speculative decoding and tensor parallel 2",
    author: "Elena Rostova <elena@ai.corp>",
    timestamp: "2 hours ago",
    status: "FAILED",
  },
  {
    id: "sync-hist-4",
    appName: "ingress-controller",
    revision: "c44b89e",
    commitMessage: "fix(ingress): enable gzip compression and proxy-buffer-size 16k",
    author: "DevOps Fleet <infra@devops.corp>",
    timestamp: "4 hours ago",
    status: "SUCCESS",
  },
];

export function getGitOpsData(engineFilter: GitOpsEngine = "all"): GitOpsData {
  let filtered = INITIAL_GITOPS_APPS;
  if (engineFilter !== "all") {
    filtered = INITIAL_GITOPS_APPS.filter((a) => a.engine === engineFilter);
  }

  const syncedCount = filtered.filter((a) => a.syncStatus === "Synced").length;
  const outOfSyncCount = filtered.filter((a) => a.syncStatus === "OutOfSync").length;
  const healthyCount = filtered.filter((a) => a.healthStatus === "Healthy").length;
  const degradedCount = filtered.filter(
    (a) => a.healthStatus === "Degraded" || a.healthStatus === "Progressing",
  ).length;
  const argoAppsCount = filtered.filter((a) => a.engine === "argocd").length;
  const fluxKustomizationsCount = filtered.filter((a) => a.engine === "flux").length;
  const driftCount = filtered.reduce((acc, a) => acc + a.drifts.length, 0);

  return {
    summary: {
      totalApps: filtered.length,
      syncedCount,
      outOfSyncCount,
      healthyCount,
      degradedCount,
      argoAppsCount,
      fluxKustomizationsCount,
      driftCount,
      lastReconciliation: "1 minute ago",
    },
    apps: filtered,
    syncHistory: INITIAL_SYNC_HISTORY,
  };
}
