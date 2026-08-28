// Enhanced API Client for all Kubernetes Workloads and Resources
export { type ClusterInfo, type Pod, type Deployment, type StatefulSet, type DaemonSet, type Job, type CronJob, type Service, type Ingress, type ConfigMap, type Secret, type Node, type Namespace, type ResourceEvent } from './k8s-store'
import type { ClusterInfo, Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob, Service, Ingress, ConfigMap, Secret, Node, Namespace, ResourceEvent } from './k8s-store'

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

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = ''
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
    const query = namespace && namespace !== 'all' ? `?type=configmaps&namespace=${encodeURIComponent(namespace)}` : '?type=configmaps'
    return this.fetchJson<ConfigMap[]>(`/api/config${query}`)
  }

  async getSecrets(namespace?: string): Promise<Secret[]> {
    const query = namespace && namespace !== 'all' ? `?type=secrets&namespace=${encodeURIComponent(namespace)}` : '?type=secrets'
    return this.fetchJson<Secret[]>(`/api/config${query}`)
  }

  async getNodes(): Promise<Node[]> {
    return this.fetchJson<Node[]>('/api/nodes')
  }

  async getNamespaces(): Promise<Namespace[]> {
    return this.fetchJson<Namespace[]>('/api/namespaces')
  }

  async getEvents(namespace?: string): Promise<ResourceEvent[]> {
    const query = namespace && namespace !== 'all' ? `?namespace=${encodeURIComponent(namespace)}` : ''
    return this.fetchJson<ResourceEvent[]>(`/api/activities${query}`)
  }

  // --- Actions ---
  async executeAction(action: string, params: Record<string, any> = {}): Promise<ActionResponse> {
    return this.fetchJson<ActionResponse>('/api/actions', {
      method: 'POST',
      body: JSON.stringify({ action, params })
    })
  }

  async scaleDeployment(name: string, namespace: string, replicas: number): Promise<ActionResponse> {
    return this.executeAction('scale-deployment', { deployment: name, namespace, replicas })
  }

  async scaleStatefulSet(name: string, namespace: string, replicas: number): Promise<ActionResponse> {
    return this.executeAction('scale-statefulset', { statefulset: name, namespace, replicas })
  }

  async restartDeployment(name: string, namespace: string): Promise<ActionResponse> {
    return this.executeAction('restart-deployment', { deployment: name, namespace })
  }

  async restartDaemonSet(name: string, namespace: string): Promise<ActionResponse> {
    return this.executeAction('restart-daemonset', { daemonset: name, namespace })
  }

  async restartPod(name: string, namespace: string): Promise<ActionResponse> {
    return this.executeAction('restart-pod', { pod: name, namespace })
  }

  async deleteResource(kind: string, name: string, namespace: string): Promise<ActionResponse> {
    return this.executeAction('delete-resource', { kind, name, namespace })
  }

  async triggerCronJob(name: string, namespace: string): Promise<ActionResponse> {
    return this.executeAction('trigger-cronjob', { cronjob: name, namespace })
  }

  async toggleCronJobSuspend(name: string, namespace: string): Promise<ActionResponse> {
    return this.executeAction('toggle-cronjob-suspend', { cronjob: name, namespace })
  }

  async cordonNode(name: string, cordon: boolean): Promise<ActionResponse> {
    return this.executeAction('cordon-node', { node: name, cordon })
  }

  async drainNode(name: string): Promise<ActionResponse> {
    return this.executeAction('drain-node', { node: name })
  }

  async getPodLogs(namespace: string, podName: string, container?: string): Promise<string> {
    const query = container ? `?container=${encodeURIComponent(container)}` : ''
    const res = await this.fetchJson<{ logs: string }>(`/api/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(podName)}/logs${query}`)
    return res.logs
  }

  async getResourceYaml(kind: string, name: string, namespace: string): Promise<string> {
    const res = await this.executeAction('get-yaml', { kind, name, namespace })
    return res.data?.yaml || ''
  }
}

export const apiClient = new ApiClient()
