// AI Diagnostics Configuration & Expert Kubernetes Diagnostic Engine

export type AiProvider = "openai" | "gemini" | "anthropic" | "custom";

export interface AiSettings {
  enabled: boolean;
  provider: AiProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
}

export interface DiagnosticRequest {
  podName: string;
  namespace: string;
  container?: string;
  status?: string;
  phase?: string;
  exitCode?: number;
  reason?: string;
  logs?: string;
  events?: string;
  userQuery?: string;
}

export interface DiagnosticResult {
  summary: string;
  rootCause: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  impact: string;
  recommendedActions: string[];
  remediationCommands: string[];
  isAiGenerated: boolean;
  providerUsed: string;
  modelUsed?: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: true,
  provider: "openai",
  apiKey: "",
  model: "gpt-4o-mini",
  customEndpoint: "",
};

export const AI_SETTINGS_STORAGE_KEY = "k8s-ai-copilot-settings";

export function getClientAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveClientAiSettings(settings: AiSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// Built-in expert Kubernetes heuristic analysis (fallback when no API key is provided)
export function analyzeKubernetesErrorHeuristically(req: DiagnosticRequest): DiagnosticResult {
  const { podName, namespace, container = "main", status = "", exitCode, reason = "", logs = "" } = req;
  const lowerLogs = logs.toLowerCase();
  const lowerStatus = status.toLowerCase();
  const lowerReason = reason.toLowerCase();

  // 1. OOMKilled / Memory pressure
  if (
    exitCode === 137 ||
    lowerReason.includes("oom") ||
    lowerLogs.includes("out of memory") ||
    lowerLogs.includes("killed")
  ) {
    return {
      summary: `Container '${container}' in Pod '${podName}' was terminated by the Linux OOM Killer (Exit Code 137).`,
      rootCause:
        "The container exceeded its configured memory limit (`resources.limits.memory`). The Linux kernel terminated the process to prevent host kernel panic.",
      severity: "CRITICAL",
      impact:
        "Application restarts continuously (CrashLoopBackOff), causing degraded response times or 502/503 errors.",
      recommendedActions: [
        "Inspect the Pod memory limits and increase `resources.limits.memory` in the Deployment manifest.",
        "Profile memory leaks (e.g. unclosed database connections, buffer allocation, cache growth).",
        "Configure runtime heap boundaries (e.g. `--max-old-space-size` for Node.js or `-XX:MaxRAMPercentage` for JVM).",
      ],
      remediationCommands: [
        `kubectl set resources deployment -n ${namespace} --containers=${container} --limits=memory=1Gi --requests=memory=512Mi`,
        `kubectl describe pod ${podName} -n ${namespace} | grep -A 5 "Last State"`,
      ],
      isAiGenerated: false,
      providerUsed: "Built-in Kubernetes Diagnostics Engine",
    };
  }

  // 2. ImagePullBackOff / ErrImagePull
  if (
    lowerStatus.includes("image") ||
    lowerReason.includes("image") ||
    lowerLogs.includes("manifest unknown") ||
    lowerLogs.includes("pull access denied")
  ) {
    return {
      summary: `Kubelet failed to pull the specified container image for '${podName}'.`,
      rootCause:
        "The container registry returned 404 (tag not found) or 401/403 (missing or invalid `imagePullSecrets`).",
      severity: "HIGH",
      impact: "Pod cannot schedule or start containers, remaining in ImagePullBackOff state indefinitely.",
      recommendedActions: [
        "Verify that the container image repository and tag exist on the registry.",
        "Ensure the namespace contains a valid `kubernetes.io/dockerconfigjson` secret with registry credentials.",
        "Add `imagePullSecrets` to the Pod spec or service account.",
      ],
      remediationCommands: [
        `kubectl get secret -n ${namespace}`,
        `kubectl describe pod ${podName} -n ${namespace} | grep -E "Image:|Events:" -A 10`,
      ],
      isAiGenerated: false,
      providerUsed: "Built-in Kubernetes Diagnostics Engine",
    };
  }

  // 3. Command not found / permission denied (Exit Code 127 / 126)
  if (
    exitCode === 127 ||
    exitCode === 126 ||
    lowerLogs.includes("not found") ||
    lowerLogs.includes("permission denied")
  ) {
    return {
      summary: `The entrypoint or command specified for container '${container}' failed to execute (Exit Code ${exitCode || 127}).`,
      rootCause:
        "The binary specified in `command` or `args` does not exist in the container image (common in Distroless/Scratch images) or lacks executable permissions.",
      severity: "HIGH",
      impact: "Container fails immediately upon initialization.",
      recommendedActions: [
        "Check Dockerfile `ENTRYPOINT` and `CMD` declarations.",
        "If using minimal base images (Distroless/Alpine), ensure target paths (e.g., `/bin/sh` vs `node server.js`) exist.",
        "Verify binary permissions with `chmod +x` during Docker build.",
      ],
      remediationCommands: [
        `kubectl logs ${podName} -n ${namespace} -c ${container} --previous`,
        `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.spec.containers[*].command}'`,
      ],
      isAiGenerated: false,
      providerUsed: "Built-in Kubernetes Diagnostics Engine",
    };
  }

  // 4. Database / Network Connection Refused
  if (
    lowerLogs.includes("econnrefused") ||
    lowerLogs.includes("connection refused") ||
    lowerLogs.includes("timeout") ||
    lowerLogs.includes("etimedout")
  ) {
    return {
      summary: `Container in Pod '${podName}' failed to establish upstream network or database connectivity.`,
      rootCause:
        "Target service or database endpoint is either not ready, unreachable due to NetworkPolicy ingress rules, or DNS lookup failed.",
      severity: "HIGH",
      impact: "Application fails health/readiness probes and rejects incoming traffic.",
      recommendedActions: [
        "Confirm target database/service Pods are in `Running` and `Ready` status.",
        "Verify Kubernetes Service DNS name (e.g. `service-name.namespace.svc.cluster.local`).",
        "Check if a `NetworkPolicy` is dropping ingress/egress traffic on target ports.",
      ],
      remediationCommands: [
        `kubectl get endpoints -n ${namespace}`,
        `kubectl get networkpolicy -n ${namespace}`,
        `kubectl exec -it ${podName} -n ${namespace} -- nc -zv <target-service> <port>`,
      ],
      isAiGenerated: false,
      providerUsed: "Built-in Kubernetes Diagnostics Engine",
    };
  }

  // 5. Default General Diagnostic
  return {
    summary: `Diagnostics report for Pod '${podName}' in namespace '${namespace}' (Status: ${status || "Running"}, Exit Code: ${exitCode ?? "N/A"}).`,
    rootCause:
      lowerLogs.length > 0
        ? "Container logs indicate an application-level runtime exception during execution."
        : "Process exited unexpectedly. Check previous container logs and Pod lifecycle events for clues.",
    severity: exitCode && exitCode !== 0 ? "HIGH" : "MEDIUM",
    impact:
      "Workload availability is degraded. Kubernetes restart policy will trigger back-off delays if instability persists.",
    recommendedActions: [
      "Inspect full previous container logs using `kubectl logs --previous`.",
      "Check recent Kubelet lifecycle events on the node.",
      "Review readiness and liveness probe thresholds to ensure startup time is sufficient.",
    ],
    remediationCommands: [
      `kubectl describe pod ${podName} -n ${namespace}`,
      `kubectl logs ${podName} -n ${namespace} -c ${container} --previous --tail=100`,
    ],
    isAiGenerated: false,
    providerUsed: "Built-in Kubernetes Diagnostics Engine",
  };
}
