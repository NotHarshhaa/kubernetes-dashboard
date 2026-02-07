// Demo data generators for Kubernetes Dashboard
import { ClusterInfo, Pod, Node, Service, Deployment, Namespace } from '@/lib/api-client'

export function generateDemoClusterInfo(): ClusterInfo {
  return {
    name: 'demo-cluster',
    version: 'v1.28.2',
    nodes: 5,
    pods: 42,
    services: 18,
    namespaces: 12
  }
}

export function generateDemoPods(): Pod[] {
  const namespaces = ['default', 'kube-system', 'monitoring', 'logging', 'frontend', 'backend']
  const statuses = ['Running', 'Pending', 'Failed', 'Succeeded']
  const phases = ['Running', 'Pending', 'Failed', 'Succeeded']
  const nodes = ['worker-node-1', 'worker-node-2', 'worker-node-3', 'control-plane-1']
  
  const podNames = [
    'nginx-deployment-7d8c9b5f9-abc12',
    'redis-cache-5f6d7c8b9-def34',
    'postgres-db-3e4f5a6b7-ghi56',
    'api-server-2a3b4c5d8-jkl78',
    'web-frontend-9c8d7e6f5-mno90',
    'auth-service-1f2e3d4c7-pqr12',
    'payment-service-6g7h8i9j3-stu45',
    'notification-worker-4k5l6m7n2-vwx67',
    'log-aggregator-8o9p0q1r9-yza89',
    'monitoring-agent-2b3c4d5e6-bcd01',
    'backup-service-7f8g9h0i3-cde23',
    'search-engine-3j4k5l6m8-def45'
  ]

  return podNames.map((name, index) => {
    const namespace = namespaces[index % namespaces.length]
    const status = index < 8 ? 'Running' : statuses[index % statuses.length]
    const phase = index < 8 ? 'Running' : phases[index % phases.length]
    const node = nodes[index % nodes.length]
    const restarts = index < 8 ? 0 : Math.floor(Math.random() * 3)
    const ready = status === 'Running' ? '1/1' : '0/1'
    
    return {
      name,
      namespace,
      status,
      phase,
      node,
      ip: `10.244.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      restarts,
      ready
    }
  })
}

export function generateDemoNodes(): Node[] {
  return [
    {
      name: 'control-plane-1',
      status: 'Ready',
      roles: ['control-plane'],
      version: 'v1.28.2',
      internalIP: '192.168.1.10',
      externalIP: '203.0.113.10',
      osImage: 'Ubuntu 22.04.3 LTS',
      kernelVersion: '5.15.0-91-generic',
      containerRuntime: 'containerd://1.6.20',
      cpuCapacity: '4',
      memoryCapacity: '8Gi',
      podsCapacity: '110',
      allocatableCPU: '4',
      allocatableMemory: '7Gi'
    },
    {
      name: 'worker-node-1',
      status: 'Ready',
      roles: ['worker'],
      version: 'v1.28.2',
      internalIP: '192.168.1.11',
      externalIP: '203.0.113.11',
      osImage: 'Ubuntu 22.04.3 LTS',
      kernelVersion: '5.15.0-91-generic',
      containerRuntime: 'containerd://1.6.20',
      cpuCapacity: '8',
      memoryCapacity: '16Gi',
      podsCapacity: '110',
      allocatableCPU: '8',
      allocatableMemory: '15Gi'
    },
    {
      name: 'worker-node-2',
      status: 'Ready',
      roles: ['worker'],
      version: 'v1.28.2',
      internalIP: '192.168.1.12',
      externalIP: '203.0.113.12',
      osImage: 'Ubuntu 22.04.3 LTS',
      kernelVersion: '5.15.0-91-generic',
      containerRuntime: 'containerd://1.6.20',
      cpuCapacity: '8',
      memoryCapacity: '16Gi',
      podsCapacity: '110',
      allocatableCPU: '8',
      allocatableMemory: '15Gi'
    },
    {
      name: 'worker-node-3',
      status: 'NotReady',
      roles: ['worker'],
      version: 'v1.28.2',
      internalIP: '192.168.1.13',
      externalIP: '203.0.113.13',
      osImage: 'Ubuntu 22.04.3 LTS',
      kernelVersion: '5.15.0-91-generic',
      containerRuntime: 'containerd://1.6.20',
      cpuCapacity: '8',
      memoryCapacity: '16Gi',
      podsCapacity: '110',
      allocatableCPU: '8',
      allocatableMemory: '15Gi'
    },
    {
      name: 'storage-node-1',
      status: 'Ready',
      roles: ['worker', 'storage'],
      version: 'v1.28.2',
      internalIP: '192.168.1.14',
      externalIP: '203.0.113.14',
      osImage: 'Ubuntu 22.04.3 LTS',
      kernelVersion: '5.15.0-91-generic',
      containerRuntime: 'containerd://1.6.20',
      cpuCapacity: '4',
      memoryCapacity: '32Gi',
      podsCapacity: '110',
      allocatableCPU: '4',
      allocatableMemory: '31Gi'
    }
  ]
}

export function generateDemoServices(): Service[] {
  const services = [
    { name: 'kubernetes', namespace: 'default', type: 'ClusterIP', clusterIP: '10.96.0.1', externalIPs: [] },
    { name: 'nginx-service', namespace: 'default', type: 'ClusterIP', clusterIP: '10.96.0.100', externalIPs: [] },
    { name: 'redis-service', namespace: 'default', type: 'ClusterIP', clusterIP: '10.96.0.101', externalIPs: [] },
    { name: 'postgres-service', namespace: 'default', type: 'ClusterIP', clusterIP: '10.96.0.102', externalIPs: [] },
    { name: 'api-service', namespace: 'default', type: 'LoadBalancer', clusterIP: '10.96.0.103', externalIPs: ['203.0.113.50'] },
    { name: 'web-service', namespace: 'default', type: 'NodePort', clusterIP: '10.96.0.104', externalIPs: [] },
    { name: 'kube-dns', namespace: 'kube-system', type: 'ClusterIP', clusterIP: '10.96.0.10', externalIPs: [] },
    { name: 'metrics-server', namespace: 'kube-system', type: 'ClusterIP', clusterIP: '10.96.0.105', externalIPs: [] },
    { name: 'prometheus', namespace: 'monitoring', type: 'ClusterIP', clusterIP: '10.96.0.200', externalIPs: [] },
    { name: 'grafana', namespace: 'monitoring', type: 'LoadBalancer', clusterIP: '10.96.0.201', externalIPs: ['203.0.113.51'] },
    { name: 'elasticsearch', namespace: 'logging', type: 'ClusterIP', clusterIP: '10.96.0.300', externalIPs: [] },
    { name: 'kibana', namespace: 'logging', type: 'ClusterIP', clusterIP: '10.96.0.301', externalIPs: [] },
    { name: 'auth-service', namespace: 'backend', type: 'ClusterIP', clusterIP: '10.96.0.400', externalIPs: [] },
    { name: 'payment-service', namespace: 'backend', type: 'ClusterIP', clusterIP: '10.96.0.401', externalIPs: [] },
    { name: 'frontend-service', namespace: 'frontend', type: 'LoadBalancer', clusterIP: '10.96.0.500', externalIPs: ['203.0.113.52'] }
  ]

  return services.map((service, index) => ({
    ...service,
    ports: `${80 + index}/TCP`,
    age: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))
}

export function generateDemoDeployments(): Deployment[] {
  const deployments = [
    { name: 'nginx-deployment', namespace: 'default', replicas: 3, readyReplicas: 3, availableReplicas: 3, unavailableReplicas: 0, images: ['nginx:1.21'] },
    { name: 'redis-deployment', namespace: 'default', replicas: 1, readyReplicas: 1, availableReplicas: 1, unavailableReplicas: 0, images: ['redis:7-alpine'] },
    { name: 'postgres-deployment', namespace: 'default', replicas: 1, readyReplicas: 1, availableReplicas: 1, unavailableReplicas: 0, images: ['postgres:15'] },
    { name: 'api-deployment', namespace: 'default', replicas: 3, readyReplicas: 2, availableReplicas: 2, unavailableReplicas: 1, images: ['node:18-alpine'] },
    { name: 'web-frontend', namespace: 'frontend', replicas: 2, readyReplicas: 2, availableReplicas: 2, unavailableReplicas: 0, images: ['nginx:1.21'] },
    { name: 'auth-deployment', namespace: 'backend', replicas: 2, readyReplicas: 2, availableReplicas: 2, unavailableReplicas: 0, images: ['python:3.11-slim'] },
    { name: 'payment-deployment', namespace: 'backend', replicas: 2, readyReplicas: 2, availableReplicas: 2, unavailableReplicas: 0, images: ['java:17-slim'] },
    { name: 'prometheus', namespace: 'monitoring', replicas: 1, readyReplicas: 1, availableReplicas: 1, unavailableReplicas: 0, images: ['prom/prometheus:latest'] },
    { name: 'grafana', namespace: 'monitoring', replicas: 1, readyReplicas: 1, availableReplicas: 1, unavailableReplicas: 0, images: ['grafana/grafana:latest'] },
    { name: 'elasticsearch', namespace: 'logging', replicas: 3, readyReplicas: 3, availableReplicas: 3, unavailableReplicas: 0, images: ['elasticsearch:8.8.0'] }
  ]

  return deployments.map((deployment, index) => ({
    ...deployment,
    age: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))
}

export function generateDemoNamespaces(): Namespace[] {
  return [
    {
      name: 'default',
      status: 'Active',
      age: '30d',
      labels: {},
      annotations: {},
      resourceQuotas: {
        pods: '10',
        services: '5',
        secrets: '10',
        configMaps: '10'
      },
      limits: {
        cpu: '2',
        memory: '4Gi'
      }
    },
    {
      name: 'kube-system',
      status: 'Active',
      age: '30d',
      labels: {},
      annotations: {},
      resourceQuotas: {
        pods: '20',
        services: '10',
        secrets: '20',
        configMaps: '20'
      },
      limits: {
        cpu: '4',
        memory: '8Gi'
      }
    },
    {
      name: 'production',
      status: 'Active',
      age: '15d',
      labels: {
        'environment': 'production',
        'team': 'backend'
      },
      annotations: {},
      resourceQuotas: {
        pods: '50',
        services: '20',
        secrets: '30',
        configMaps: '20'
      },
      limits: {
        cpu: '10',
        memory: '16Gi'
      }
    },
    {
      name: 'staging',
      status: 'Active',
      age: '10d',
      labels: {
        'environment': 'staging',
        'team': 'backend'
      },
      annotations: {},
      resourceQuotas: {
        pods: '30',
        services: '15',
        secrets: '20',
        configMaps: '15'
      },
      limits: {
        cpu: '6',
        memory: '12Gi'
      }
    },
    {
      name: 'development',
      status: 'Active',
      age: '7d',
      labels: {
        'environment': 'development',
        'team': 'frontend'
      },
      annotations: {},
      resourceQuotas: {
        pods: '25',
        services: '10',
        secrets: '15',
        configMaps: '15'
      },
      limits: {
        cpu: '4',
        memory: '8Gi'
      }
    }
  ]
}
