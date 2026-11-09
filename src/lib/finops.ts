// FinOps & Kubernetes Cost Optimization Engine

export type CloudProvider = "aws" | "gcp" | "azure" | "custom";

export interface PricingRates {
  cpuHourly: number; // $ per vCPU hour
  memoryHourlyGb: number; // $ per GB hour
  storageMonthlyGb: number; // $ per GB month (e.g. EBS gp3)
  gpuHourly: number; // $ per GPU hour
}

export const CLOUD_PRICING_PROFILES: Record<CloudProvider, PricingRates> = {
  aws: {
    cpuHourly: 0.04048, // c6i/m6i standard compute (~$29.15/mo per core)
    memoryHourlyGb: 0.00543, // ~$3.91/mo per GB
    storageMonthlyGb: 0.08, // AWS EBS gp3
    gpuHourly: 1.85, // AWS g5.xlarge / A10G
  },
  gcp: {
    cpuHourly: 0.0316, // n2-standard
    memoryHourlyGb: 0.0042, // n2 RAM
    storageMonthlyGb: 0.08, // GCP pd-balanced
    gpuHourly: 1.78, // NVIDIA L4 / T4
  },
  azure: {
    cpuHourly: 0.038, // D-series v5
    memoryHourlyGb: 0.0051, // Azure RAM
    storageMonthlyGb: 0.085, // Azure Premium SSD
    gpuHourly: 1.9, // NC-series
  },
  custom: {
    cpuHourly: 0.035,
    memoryHourlyGb: 0.0045,
    storageMonthlyGb: 0.07,
    gpuHourly: 1.5,
  },
};

export interface NamespaceCost {
  namespace: string;
  monthlyCost: number;
  percentage: number;
  cpuCost: number;
  memoryCost: number;
  storageCost: number;
  gpuCost: number;
  efficiencyScore: number;
  podCount: number;
}

export interface CostBreakdownItem {
  dimension: string;
  monthlyCost: number;
  percentage: number;
  color: string;
}

export type RecommendationType =
  | "RIGHTSIZE_DEPLOYMENT"
  | "ORPHANED_PVC"
  | "NODE_CONSOLIDATION"
  | "IDLE_GPU"
  | "STORAGE_CLASS_OPTIMIZATION";

export interface CostRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  resourceKind: string;
  resourceName: string;
  namespace: string;
  currentSpec: string;
  recommendedSpec: string;
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  monthlySavings: number;
  impactLevel: "LOW" | "MEDIUM" | "HIGH";
  risk: "SAFE" | "NEEDS_REVIEW";
  remediationCommand: string;
}

export interface FinOpsData {
  currency: string;
  provider: CloudProvider;
  clusterMonthlySpend: number;
  potentialMonthlySavings: number;
  wastedSpend: number;
  efficiencyScore: number;
  efficiencyGrade: "A" | "B" | "C" | "D" | "F";
  dailyTrend: { date: string; spend: number; optimizedSpend: number }[];
  namespaceBreakdown: NamespaceCost[];
  resourceBreakdown: CostBreakdownItem[];
  recommendations: CostRecommendation[];
  summary: {
    totalNodes: number;
    totalCores: number;
    totalMemoryGb: number;
    totalStorageGb: number;
    totalGpus: number;
    totalPods: number;
  };
}

export function computeEfficiencyGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

// Generates dynamic, realistic FinOps cluster cost breakdown and recommendations
export function generateFinOpsAnalytics(
  provider: CloudProvider = "aws",
  workloadCount = 18,
  nodeCount = 4,
): FinOpsData {
  const rates = CLOUD_PRICING_PROFILES[provider] || CLOUD_PRICING_PROFILES.aws;
  const hoursPerMonth = 720;

  // Base cluster capacity: 4 nodes with 8 cores, 32GB RAM each
  const totalCores = nodeCount * 8;
  const totalMemoryGb = nodeCount * 32;
  const totalStorageGb = 1250;
  const totalGpus = 2;

  // Monthly base costs
  const monthlyComputeCost = totalCores * rates.cpuHourly * hoursPerMonth;
  const monthlyMemoryCost = totalMemoryGb * rates.memoryHourlyGb * hoursPerMonth;
  const monthlyStorageCost = totalStorageGb * rates.storageMonthlyGb;
  const monthlyGpuCost = totalGpus * rates.gpuHourly * hoursPerMonth;
  const monthlyNetworkCost = 145.2;

  const clusterMonthlySpend = Math.round(
    monthlyComputeCost + monthlyMemoryCost + monthlyStorageCost + monthlyGpuCost + monthlyNetworkCost,
  );

  // Recommendations:
  const recommendations: CostRecommendation[] = [
    {
      id: "rec-rightsize-payment-api",
      type: "RIGHTSIZE_DEPLOYMENT",
      title: "Right-Size Overprovisioned 'payment-api' Deployment",
      description:
        "Container requested 4.0 vCPU and 8.0 GiB RAM but average historical utilization is 0.28 vCPU (7%) and 1.1 GiB RAM (14%).",
      resourceKind: "Deployment",
      resourceName: "payment-api",
      namespace: "production",
      currentSpec: "Requests: 4 CPU / 8Gi | Limits: 8 CPU / 16Gi",
      recommendedSpec: "Requests: 1 CPU / 2Gi | Limits: 2 CPU / 4Gi",
      currentMonthlyCost: 268.4,
      projectedMonthlyCost: 67.1,
      monthlySavings: 201.3,
      impactLevel: "HIGH",
      risk: "SAFE",
      remediationCommand:
        "kubectl set resources deployment payment-api -n production --requests=cpu=1,memory=2Gi --limits=cpu=2,memory=4Gi",
    },
    {
      id: "rec-rightsize-frontend",
      type: "RIGHTSIZE_DEPLOYMENT",
      title: "Reduce Overallocated CPU on 'frontend-v2'",
      description:
        "Web pods have static 2.0 vCPU requests with average cluster CPU utilization sitting under 120m across all replicas.",
      resourceKind: "Deployment",
      resourceName: "frontend-v2",
      namespace: "default",
      currentSpec: "Requests: 2 CPU / 2Gi (3 replicas)",
      recommendedSpec: "Requests: 500m / 1Gi (3 replicas)",
      currentMonthlyCost: 174.9,
      projectedMonthlyCost: 43.7,
      monthlySavings: 131.2,
      impactLevel: "MEDIUM",
      risk: "SAFE",
      remediationCommand:
        "kubectl set resources deployment frontend-v2 -n default --requests=cpu=500m,memory=1Gi --limits=cpu=1,memory=2Gi",
    },
    {
      id: "rec-orphaned-pvc-backup",
      type: "ORPHANED_PVC",
      title: "Purge Unattached PersistentVolume 'data-backup-archive-pvc'",
      description:
        "A 250 GiB gp3 EBS volume has been unmounted and unattached for 42 consecutive days, incurring continuous block storage fees.",
      resourceKind: "PersistentVolumeClaim",
      resourceName: "data-backup-archive-pvc",
      namespace: "storage",
      currentSpec: "250 GiB gp3 Storage",
      recommendedSpec: "Delete or snapshot to cold Glacier tier",
      currentMonthlyCost: 35.0,
      projectedMonthlyCost: 0.0,
      monthlySavings: 35.0,
      impactLevel: "LOW",
      risk: "SAFE",
      remediationCommand: "kubectl delete pvc data-backup-archive-pvc -n storage",
    },
    {
      id: "rec-node-consolidation-worker3",
      type: "NODE_CONSOLIDATION",
      title: "Consolidate Low-Utilization Node 'worker-node-03'",
      description:
        "Node 'worker-node-03' has only 3 running pods and sits at 11% overall cluster allocation. Pods can be bin-packed onto worker-01 and worker-02.",
      resourceKind: "Node",
      resourceName: "worker-node-03",
      namespace: "kube-system",
      currentSpec: "m6i.2xlarge (8 vCPU / 32GiB)",
      recommendedSpec: "Cordon & drain to consolidate workloads",
      currentMonthlyCost: 288.0,
      projectedMonthlyCost: 0.0,
      monthlySavings: 288.0,
      impactLevel: "HIGH",
      risk: "NEEDS_REVIEW",
      remediationCommand:
        "kubectl cordon worker-node-03 && kubectl drain worker-node-03 --ignore-daemonsets --delete-emptydir-data",
    },
    {
      id: "rec-idle-gpu-eval",
      type: "IDLE_GPU",
      title: "Scale to Zero Idle AI Evaluation Sandbox GPU",
      description:
        "Dedicated NVIDIA A10G GPU in 'ai-research' namespace has received 0 inference requests for the past 96 hours.",
      resourceKind: "Deployment",
      resourceName: "vllm-eval-sandbox",
      namespace: "ai-research",
      currentSpec: "1x NVIDIA A10G (24GB VRAM)",
      recommendedSpec: "Scale replicas to 0 when idle",
      currentMonthlyCost: 399.6,
      projectedMonthlyCost: 0.0,
      monthlySavings: 399.6,
      impactLevel: "HIGH",
      risk: "SAFE",
      remediationCommand: "kubectl scale deployment vllm-eval-sandbox -n ai-research --replicas=0",
    },
  ];

  const potentialMonthlySavings = Math.round(recommendations.reduce((acc, r) => acc + r.monthlySavings, 0));
  const wastedSpend = Math.round(potentialMonthlySavings * 0.88);
  const efficiencyScore = Math.max(
    10,
    Math.min(95, Math.round(((clusterMonthlySpend - wastedSpend) / clusterMonthlySpend) * 100)),
  );
  const efficiencyGrade = computeEfficiencyGrade(efficiencyScore);

  // Daily trend over last 14 days
  const dailyTrend = [];
  const today = new Date();
  const dailyAvg = clusterMonthlySpend / 30;
  const optimizedAvg = (clusterMonthlySpend - potentialMonthlySavings) / 30;

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const variance = Math.sin(i * 1.5) * 12;
    dailyTrend.push({
      date: dateStr,
      spend: Math.round(dailyAvg + variance),
      optimizedSpend: Math.round(optimizedAvg + variance * 0.4),
    });
  }

  // Namespace Breakdown
  const namespaceBreakdown: NamespaceCost[] = [
    {
      namespace: "production",
      monthlyCost: Math.round(clusterMonthlySpend * 0.44),
      percentage: 44,
      cpuCost: Math.round(clusterMonthlySpend * 0.44 * 0.45),
      memoryCost: Math.round(clusterMonthlySpend * 0.44 * 0.35),
      storageCost: Math.round(clusterMonthlySpend * 0.44 * 0.2),
      gpuCost: 0,
      efficiencyScore: 78,
      podCount: 14,
    },
    {
      namespace: "ai-research",
      monthlyCost: Math.round(clusterMonthlySpend * 0.28),
      percentage: 28,
      cpuCost: Math.round(clusterMonthlySpend * 0.28 * 0.15),
      memoryCost: Math.round(clusterMonthlySpend * 0.28 * 0.2),
      storageCost: Math.round(clusterMonthlySpend * 0.28 * 0.05),
      gpuCost: Math.round(clusterMonthlySpend * 0.28 * 0.6),
      efficiencyScore: 54,
      podCount: 5,
    },
    {
      namespace: "default",
      monthlyCost: Math.round(clusterMonthlySpend * 0.14),
      percentage: 14,
      cpuCost: Math.round(clusterMonthlySpend * 0.14 * 0.5),
      memoryCost: Math.round(clusterMonthlySpend * 0.14 * 0.4),
      storageCost: Math.round(clusterMonthlySpend * 0.14 * 0.1),
      gpuCost: 0,
      efficiencyScore: 82,
      podCount: 8,
    },
    {
      namespace: "kube-system",
      monthlyCost: Math.round(clusterMonthlySpend * 0.09),
      percentage: 9,
      cpuCost: Math.round(clusterMonthlySpend * 0.09 * 0.6),
      memoryCost: Math.round(clusterMonthlySpend * 0.09 * 0.35),
      storageCost: Math.round(clusterMonthlySpend * 0.09 * 0.05),
      gpuCost: 0,
      efficiencyScore: 92,
      podCount: 9,
    },
    {
      namespace: "monitoring",
      monthlyCost: Math.round(clusterMonthlySpend * 0.05),
      percentage: 5,
      cpuCost: Math.round(clusterMonthlySpend * 0.05 * 0.3),
      memoryCost: Math.round(clusterMonthlySpend * 0.05 * 0.4),
      storageCost: Math.round(clusterMonthlySpend * 0.05 * 0.3),
      gpuCost: 0,
      efficiencyScore: 85,
      podCount: 4,
    },
  ];

  // Resource breakdown
  const resourceBreakdown: CostBreakdownItem[] = [
    {
      dimension: "Compute (vCPU)",
      monthlyCost: Math.round(monthlyComputeCost),
      percentage: Math.round((monthlyComputeCost / clusterMonthlySpend) * 100),
      color: "var(--chart-1)",
    },
    {
      dimension: "Memory (RAM)",
      monthlyCost: Math.round(monthlyMemoryCost),
      percentage: Math.round((monthlyMemoryCost / clusterMonthlySpend) * 100),
      color: "var(--chart-2)",
    },
    {
      dimension: "GPU Accelerators",
      monthlyCost: Math.round(monthlyGpuCost),
      percentage: Math.round((monthlyGpuCost / clusterMonthlySpend) * 100),
      color: "var(--chart-3)",
    },
    {
      dimension: "Block Storage (PV)",
      monthlyCost: Math.round(monthlyStorageCost),
      percentage: Math.round((monthlyStorageCost / clusterMonthlySpend) * 100),
      color: "var(--chart-4)",
    },
    {
      dimension: "Network & Egress",
      monthlyCost: Math.round(monthlyNetworkCost),
      percentage: Math.round((monthlyNetworkCost / clusterMonthlySpend) * 100),
      color: "var(--chart-5)",
    },
  ];

  return {
    currency: "USD ($)",
    provider,
    clusterMonthlySpend,
    potentialMonthlySavings,
    wastedSpend,
    efficiencyScore,
    efficiencyGrade,
    dailyTrend,
    namespaceBreakdown,
    resourceBreakdown,
    recommendations,
    summary: {
      totalNodes: nodeCount,
      totalCores,
      totalMemoryGb,
      totalStorageGb,
      totalGpus,
      totalPods: workloadCount * 2,
    },
  };
}
