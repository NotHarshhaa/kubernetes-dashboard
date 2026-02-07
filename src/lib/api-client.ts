export interface ClusterInfo {
  name: string
  version: string
  nodes: number
  pods: number
  services: number
  namespaces: number
}

export interface Pod {
  name: string
  namespace: string
  status: string
  phase: string
  node: string
  ip: string
  createdAt: string
  restarts: number
  ready: string
}

export interface Service {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIPs: string[]
  ports: string
  age: string
}

export interface Node {
  name: string
  status: string
  roles: string[]
  version: string
  internalIP: string
  externalIP: string
  osImage: string
  kernelVersion: string
  containerRuntime: string
  cpuCapacity: string
  memoryCapacity: string
  podsCapacity: string
  allocatableCPU: string
  allocatableMemory: string
}

export interface Deployment {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  availableReplicas: number
  unavailableReplicas: number
  age: string
  images: string[]
}

export interface Namespace {
  name: string
  status: string
  age: string
  labels: Record<string, string>
  annotations: Record<string, string>
  resourceQuotas: {
    pods?: string
    services?: string
    secrets?: string
    configMaps?: string
  }
  limits: {
    cpu?: string
    memory?: string
  }
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'
  }

  async getClusterInfo(): Promise<ClusterInfo> {
    const response = await fetch(`${this.baseUrl}/api/cluster`)
    if (!response.ok) {
      throw new Error('Failed to fetch cluster info')
    }
    return response.json()
  }

  async getPods(namespace?: string): Promise<Pod[]> {
    const url = namespace 
      ? `${this.baseUrl}/api/pods?namespace=${namespace}`
      : `${this.baseUrl}/api/pods`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch pods')
    }
    return response.json()
  }

  async getServices(namespace?: string): Promise<Service[]> {
    const url = namespace 
      ? `${this.baseUrl}/api/services?namespace=${namespace}`
      : `${this.baseUrl}/api/services`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch services')
    }
    return response.json()
  }

  async getNodes(): Promise<Node[]> {
    const response = await fetch(`${this.baseUrl}/api/nodes`)
    if (!response.ok) {
      throw new Error('Failed to fetch nodes')
    }
    return response.json()
  }

  async getDeployments(namespace?: string): Promise<Deployment[]> {
    const url = namespace 
      ? `${this.baseUrl}/api/deployments?namespace=${namespace}`
      : `${this.baseUrl}/api/deployments`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch deployments')
    }
    return response.json()
  }

  async getNamespaces(): Promise<Namespace[]> {
    const response = await fetch(`${this.baseUrl}/api/namespaces`)
    if (!response.ok) {
      throw new Error('Failed to fetch namespaces')
    }
    return response.json()
  }
}

export const apiClient = new ApiClient()
