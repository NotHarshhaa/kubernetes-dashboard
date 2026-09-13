// Enhanced API Client for all Kubernetes Workloads, Storage, Helm, Security, and Terminal
export {
  type ClusterInfo,
  type Pod,
  type Deployment,
  type StatefulSet,
  type DaemonSet,
  type Job,
  type CronJob,
  type Service,
  type Ingress,
  type ConfigMap,
  type Secret,
  type Node,
  type Namespace,
  type PersistentVolume,
  type PersistentVolumeClaim,
  type StorageClass,
  type HelmRelease,
  type HelmChart,
  type SecurityFinding,
  type SecurityReport,
  type ResourceEvent
} from './k8s-store'

import type {
  ClusterInfo,
  Pod,
  Deployment,
  StatefulSet,
  DaemonSet,
  Job,
  CronJob,
  Service,
  Ingress,
  ConfigMap,
  Secret,
  Node,
  Namespace,
  PersistentVolume,
  PersistentVolumeClaim,
  StorageClass,
  HelmRelease,
  HelmChart,
  SecurityReport,
  ResourceEvent
} from './k8s-store'

export interface StorageData {
  persistentVolumes: PersistentVolume[]
  persistentVolumeClaims: PersistentVolumeClaim[]
  storageClasses: StorageClass[]
}

export interface WorkloadSummary {
  deployments: Deployment[]
  statefulSets: StatefulSet[]
  daemonSets: DaemonSet[]
  jobs: Job[]
  cronJobs: CronJob[]
  pods: Pod[]
  summary: {
    totalWorkloads: number
    healthyWorkloads: number
    warningWorkloads: number
    totalPods: number
    runningPods: number
  }
}

export interface ActionResponse {
  success: boolean
  message: string
  data?: any
}

export interface CustomResourceDefinitionItem {
  name: string
  group: string
  version: string
  kind: string
  singularName: string
  scope: 'Namespaced' | 'Cluster'
  established: boolean
  categories: string[]
  creationTimestamp: string
  instanceCount?: number
}

export interface GatewayItem {
  name: string
  namespace: string
  gatewayClassName: string
  listeners: {
    name: string
    port: number
    protocol: string
    routesCount?: number
  }[]
  addresses: string[]
  status: 'Programmed' | 'Accepted' | 'Pending' | 'Error'
  creationTimestamp: string
}

export interface HTTPRouteItem {
  name: string
  namespace: string
  hostnames: string[]
  parentGateways: string[]
  rules: {
    matches?: { path?: { type: string; value: string } }[]
    backendRefs: { name: string; port: number; weight?: number }[]
  }[]
  status: 'Accepted' | 'Pending' | 'Degraded'
  creationTimestamp: string
}

export interface ContextItem {
  name: string
  cluster: string
  user: string
  namespace?: string
  isCurrent: boolean
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = ''
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const contextHeader: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('k8s-context')
      if (active) {
        contextHeader['x-k8s-context'] = active
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...contextHeader,
        ...(options?.headers || {})
      }
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorJson = await response.json()
        if (errorJson.message || errorJson.error) {
          errorMessage = errorJson.message || errorJson.error
        }
      } catch (_) {}
      throw new Error(errorMessage)
    }

    return response.json()
  }

  async getClusterInfo(): Promise<ClusterInfo> {
    return this.fetchJson<ClusterInfo>('/api/cluster')
  }

  async getPods(namespace?: string): Promise<Pod[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<Pod[]>(`/api/pods${query}`)
  }

  async getDeployments(namespace?: string): Promise<Deployment[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<Deployment[]>(`/api/deployments${query}`)
  }

  async getStatefulSets(namespace?: string): Promise<StatefulSet[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<StatefulSet[]>(`/api/statefulsets${query}`)
  }

  async getDaemonSets(namespace?: string): Promise<DaemonSet[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<DaemonSet[]>(`/api/daemonsets${query}`)
  }

  async getJobs(namespace?: string): Promise<Job[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<Job[]>(`/api/jobs${query}`)
  }

  async getCronJobs(namespace?: string): Promise<CronJob[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<CronJob[]>(`/api/cronjobs${query}`)
  }

  async getWorkloads(namespace?: string): Promise<WorkloadSummary> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<WorkloadSummary>(`/api/workloads${query}`)
  }

  async getServices(namespace?: string): Promise<Service[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<Service[]>(`/api/services${query}`)
  }

  async getIngresses(namespace?: string): Promise<Ingress[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<Ingress[]>(`/api/ingresses${query}`)
  }

  async getConfigMaps(namespace?: string): Promise<ConfigMap[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<ConfigMap[]>(`/api/config?kind=configmaps${query ? `&namespace=${encodeURIComponent(namespace!)}` : ''}`)
  }

  async getSecrets(namespace?: string): Promise<Secret[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<Secret[]>(`/api/config?kind=secrets${query ? `&namespace=${encodeURIComponent(namespace!)}` : ''}`)
  }

  async getNodes(): Promise<Node[]> {
    return this.fetchJson<Node[]>('/api/nodes')
  }

  async getNamespaces(): Promise<Namespace[]> {
    return this.fetchJson<Namespace[]>('/api/namespaces')
  }

  // --- Storage API ---
  async getStorageData(namespace?: string): Promise<StorageData> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<StorageData>(`/api/storage${query}`)
  }

  // --- Helm API ---
  async getHelmReleases(namespace?: string): Promise<HelmRelease[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<HelmRelease[]>(`/api/helm?action=releases${query ? `&namespace=${encodeURIComponent(namespace!)}` : ''}`)
  }

  async getHelmCharts(): Promise<HelmChart[]> {
    return this.fetchJson<HelmChart[]>('/api/helm?action=charts')
  }

  async installHelmChart(chartName: string, releaseName: string, namespace: string): Promise<HelmRelease> {
    return this.fetchJson<HelmRelease>('/api/helm', {
      method: 'POST',
      body: JSON.stringify({ action: 'install', chartName, releaseName, namespace })
    })
  }

  async rollbackHelmRelease(releaseName: string, namespace: string, revision: number): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/helm', {
      method: 'POST',
      body: JSON.stringify({ action: 'rollback', releaseName, namespace, revision })
    })
  }

  async uninstallHelmRelease(releaseName: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/helm', {
      method: 'POST',
      body: JSON.stringify({ action: 'uninstall', releaseName, namespace })
    })
  }

  // --- Security & CIS Benchmark API ---
  async getSecurityReport(): Promise<SecurityReport> {
    return this.fetchJson<SecurityReport>('/api/security')
  }

  // --- Container Exec Terminal API ---
  async execCommand(podName: string, namespace: string, container: string, command: string): Promise<{ output: string; exitCode: number }> {
    return this.fetchJson<{ output: string; exitCode: number }>('/api/exec', {
      method: 'POST',
      body: JSON.stringify({ podName, namespace, container, command })
    })
  }

  // --- Common Mutations ---
  async scaleDeployment(name: string, namespace: string, replicas: number): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'scale', resourceKind: 'Deployment', resourceName: name, namespace, replicas })
    })
  }

  async scaleStatefulSet(name: string, namespace: string, replicas: number): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'scale', resourceKind: 'StatefulSet', resourceName: name, namespace, replicas })
    })
  }

  async restartDeployment(name: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'restart', resourceKind: 'Deployment', resourceName: name, namespace })
    })
  }

  async restartDaemonSet(name: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'restart', resourceKind: 'DaemonSet', resourceName: name, namespace })
    })
  }

  async restartPod(name: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'restart', resourceKind: 'Pod', resourceName: name, namespace })
    })
  }

  async triggerCronJob(name: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'trigger', resourceKind: 'CronJob', resourceName: name, namespace })
    })
  }

  async toggleCronJobSuspend(name: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-suspend', resourceKind: 'CronJob', resourceName: name, namespace })
    })
  }

  async cordonNode(name: string, cordon: boolean): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: cordon ? 'cordon' : 'uncordon', resourceKind: 'Node', resourceName: name, namespace: '' })
    })
  }

  async drainNode(name: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'drain', resourceKind: 'Node', resourceName: name, namespace: '' })
    })
  }

  async deleteResource(kind: string, name: string, namespace: string): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/resources', {
      method: 'DELETE',
      body: JSON.stringify({ kind, name, namespace })
    })
  }

  async getPodLogs(namespace: string, podName: string, container?: string): Promise<string> {
    const query = container ? `?container=${encodeURIComponent(container)}` : ''
    const headers: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('k8s-context')
      if (active) headers['x-k8s-context'] = active
    }
    const res = await fetch(`/api/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(podName)}/logs${query}`, { headers })
    if (!res.ok) throw new Error('Failed to fetch pod logs')
    try {
      const json = await res.json()
      return json.logs || ''
    } catch {
      return res.text()
    }
  }

  async getResourceYaml(kind: string, name: string, namespace: string): Promise<string> {
    const res = await fetch(`/api/resources?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}&namespace=${encodeURIComponent(namespace || '')}`)
    if (!res.ok) throw new Error('Failed to fetch YAML')
    return res.text()
  }

  async getContexts(): Promise<{ currentContext: string; contexts: ContextItem[] }> {
    return this.fetchJson<{ currentContext: string; contexts: ContextItem[] }>('/api/contexts')
  }

  async switchContext(context: string): Promise<{ success: boolean; currentContext: string; message: string }> {
    const res = await this.fetchJson<{ success: boolean; currentContext: string; message: string }>('/api/contexts', {
      method: 'POST',
      body: JSON.stringify({ context })
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('k8s-context', context)
    }
    return res
  }

  async getCRDs(): Promise<CustomResourceDefinitionItem[]> {
    return this.fetchJson<CustomResourceDefinitionItem[]>('/api/crds')
  }

  async getGateways(namespace?: string): Promise<GatewayItem[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<GatewayItem[]>(`/api/gateways${query}`)
  }

  async getHTTPRoutes(namespace?: string): Promise<HTTPRouteItem[]> {
    const query = namespace && namespace !== 'all' ? `?type=routes&namespace=${encodeURIComponent(namespace)}` : '?type=routes'
    return this.fetchJson<HTTPRouteItem[]>(`/api/gateways${query}`)
  }
}

export const apiClient = new ApiClient()
