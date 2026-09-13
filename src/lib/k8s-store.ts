// Centralized reactive in-memory state store for Kubernetes Dashboard
// Powers demo/simulated mode and synchronizes mutations end-to-end

export interface ClusterInfo {
  name: string
  version: string
  nodes: number
  pods: number
  services: number
  namespaces: number
  cpuUsage?: number
  memoryUsage?: number
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
  containers?: {
    name: string
    image: string
    ready: boolean
    restartCount: number
    ports?: number[]
  }[]
  labels?: Record<string, string>
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
  labels?: Record<string, string>
  strategy?: string
  gitops?: {
    manager: 'argocd' | 'flux' | null
    applicationName?: string
    syncStatus?: 'Synced' | 'OutOfSync' | 'Reconciling'
  }
}

export interface StatefulSet {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  currentReplicas: number
  age: string
  images: string[]
  serviceName: string
  labels?: Record<string, string>
}

export interface DaemonSet {
  name: string
  namespace: string
  desiredNumberScheduled: number
  currentNumberScheduled: number
  numberReady: number
  numberAvailable: number
  age: string
  images: string[]
  labels?: Record<string, string>
}

export interface Job {
  name: string
  namespace: string
  completions: number
  succeeded: number
  failed: number
  active: number
  startTime: string
  completionTime?: string
  duration?: string
  status: 'Complete' | 'Running' | 'Failed'
  images: string[]
  labels?: Record<string, string>
}

export interface CronJob {
  name: string
  namespace: string
  schedule: string
  suspend: boolean
  activeJobs: number
  lastScheduleTime?: string
  lastSuccessfulTime?: string
  images: string[]
  age: string
  labels?: Record<string, string>
}

export interface Service {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIPs: string[]
  ports: string
  age: string
  selector?: Record<string, string>
}

export interface Ingress {
  name: string
  namespace: string
  hosts: string[]
  paths: { path: string; backend: string; port: number }[]
  loadBalancerIP?: string
  tls: boolean
  age: string
}

export interface ConfigMap {
  name: string
  namespace: string
  data: Record<string, string>
  age: string
  labels?: Record<string, string>
}

export interface Secret {
  name: string
  namespace: string
  type: string
  data: Record<string, string>
  age: string
  labels?: Record<string, string>
}

export interface Node {
  name: string
  status: 'Ready' | 'NotReady' | 'SchedulingDisabled'
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

export interface PersistentVolume {
  name: string
  capacity: string
  accessModes: string[]
  reclaimPolicy: 'Retain' | 'Delete' | 'Recycle'
  status: 'Bound' | 'Available' | 'Released' | 'Failed'
  claim: string
  storageClass: string
  age: string
  volumeType: string
}

export interface PersistentVolumeClaim {
  name: string
  namespace: string
  status: 'Bound' | 'Pending' | 'Lost'
  volume: string
  capacity: string
  accessModes: string[]
  storageClass: string
  age: string
  usedCapacity?: string
}

export interface StorageClass {
  name: string
  provisioner: string
  reclaimPolicy: 'Delete' | 'Retain'
  volumeBindingMode: string
  allowVolumeExpansion: boolean
  isDefault: boolean
  age: string
}

export interface HelmRelease {
  name: string
  namespace: string
  revision: number
  updated: string
  status: 'deployed' | 'failed' | 'pending-upgrade' | 'uninstalled'
  chart: string
  appVersion: string
  description: string
}

export interface HelmChart {
  name: string
  version: string
  appVersion: string
  description: string
  icon?: string
  repository: string
  installed?: boolean
}

export interface SecurityFinding {
  id: string
  category: 'Workload' | 'Network' | 'RBAC' | 'Configuration'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  resourceKind: string
  resourceName: string
  namespace: string
  remediation: string
  impact: string
}

export interface SecurityReport {
  overallScore: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  scannedResources: number
  passedChecks: number
  failedChecks: number
  findings: SecurityFinding[]
  categoryScores: {
    workload: number
    network: number
    rbac: number
    config: number
  }
}

export interface ResourceEvent {
  id: string
  type: 'Normal' | 'Warning'
  reason: string
  message: string
  involvedObject: {
    kind: string
    name: string
    namespace: string
  }
  timestamp: string
}

class K8sStore {
  private pods: Pod[] = []
  private deployments: Deployment[] = []
  private statefulSets: StatefulSet[] = []
  private daemonSets: DaemonSet[] = []
  private jobs: Job[] = []
  private cronJobs: CronJob[] = []
  private services: Service[] = []
  private ingresses: Ingress[] = []
  private configMaps: ConfigMap[] = []
  private secrets: Secret[] = []
  private nodes: Node[] = []
  private namespaces: Namespace[] = []
  private persistentVolumes: PersistentVolume[] = []
  private persistentVolumeClaims: PersistentVolumeClaim[] = []
  private storageClasses: StorageClass[] = []
  private helmReleases: HelmRelease[] = []
  private helmCharts: HelmChart[] = []
  private events: ResourceEvent[] = []
  private initialized = false

  constructor() {
    this.initDefaultData()
  }

  private initDefaultData() {
    if (this.initialized) return

    // Nodes
    this.nodes = [
      {
        name: 'k8s-control-plane-01',
        status: 'Ready',
        roles: ['control-plane', 'master'],
        version: 'v1.28.2',
        internalIP: '192.168.1.10',
        externalIP: '203.0.113.10',
        osImage: 'Ubuntu 22.04.3 LTS',
        kernelVersion: '5.15.0-91-generic',
        containerRuntime: 'containerd://1.6.20',
        cpuCapacity: '8',
        memoryCapacity: '16Gi',
        podsCapacity: '110',
        allocatableCPU: '7.8',
        allocatableMemory: '15.2Gi'
      },
      {
        name: 'k8s-worker-node-01',
        status: 'Ready',
        roles: ['worker'],
        version: 'v1.28.2',
        internalIP: '192.168.1.11',
        externalIP: '203.0.113.11',
        osImage: 'Ubuntu 22.04.3 LTS',
        kernelVersion: '5.15.0-91-generic',
        containerRuntime: 'containerd://1.6.20',
        cpuCapacity: '16',
        memoryCapacity: '32Gi',
        podsCapacity: '110',
        allocatableCPU: '15.5',
        allocatableMemory: '30.8Gi'
      },
      {
        name: 'k8s-worker-node-02',
        status: 'Ready',
        roles: ['worker'],
        version: 'v1.28.2',
        internalIP: '192.168.1.12',
        externalIP: '203.0.113.12',
        osImage: 'Ubuntu 22.04.3 LTS',
        kernelVersion: '5.15.0-91-generic',
        containerRuntime: 'containerd://1.6.20',
        cpuCapacity: '16',
        memoryCapacity: '32Gi',
        podsCapacity: '110',
        allocatableCPU: '15.5',
        allocatableMemory: '30.8Gi'
      },
      {
        name: 'k8s-worker-node-03',
        status: 'Ready',
        roles: ['worker', 'gpu'],
        version: 'v1.28.2',
        internalIP: '192.168.1.13',
        externalIP: '203.0.113.13',
        osImage: 'Ubuntu 22.04.3 LTS',
        kernelVersion: '5.15.0-91-generic',
        containerRuntime: 'containerd://1.6.20',
        cpuCapacity: '32',
        memoryCapacity: '64Gi',
        podsCapacity: '110',
        allocatableCPU: '31.2',
        allocatableMemory: '62.0Gi'
      }
    ]

    // Namespaces
    this.namespaces = [
      {
        name: 'default',
        status: 'Active',
        age: '45d',
        labels: { 'kubernetes.io/metadata.name': 'default' },
        annotations: {},
        resourceQuotas: { pods: '30', services: '15', secrets: '25', configMaps: '25' },
        limits: { cpu: '8', memory: '16Gi' }
      },
      {
        name: 'production',
        status: 'Active',
        age: '30d',
        labels: { environment: 'production', tier: 'backend' },
        annotations: {},
        resourceQuotas: { pods: '100', services: '50', secrets: '50', configMaps: '50' },
        limits: { cpu: '32', memory: '64Gi' }
      },
      {
        name: 'staging',
        status: 'Active',
        age: '20d',
        labels: { environment: 'staging' },
        annotations: {},
        resourceQuotas: { pods: '50', services: '25', secrets: '30', configMaps: '30' },
        limits: { cpu: '16', memory: '32Gi' }
      },
      {
        name: 'monitoring',
        status: 'Active',
        age: '45d',
        labels: { role: 'observability' },
        annotations: {},
        resourceQuotas: { pods: '40', services: '20', secrets: '20', configMaps: '20' },
        limits: { cpu: '16', memory: '32Gi' }
      },
      {
        name: 'kube-system',
        status: 'Active',
        age: '45d',
        labels: { 'kubernetes.io/metadata.name': 'kube-system' },
        annotations: {},
        resourceQuotas: { pods: '50', services: '20', secrets: '50', configMaps: '50' },
        limits: { cpu: '16', memory: '32Gi' }
      }
    ]

    // Deployments
    this.deployments = [
      {
        name: 'api-gateway',
        namespace: 'production',
        replicas: 4,
        readyReplicas: 4,
        availableReplicas: 4,
        unavailableReplicas: 0,
        age: '18d',
        images: ['envoyproxy/envoy:v1.28.0'],
        labels: { app: 'api-gateway', tier: 'ingress' },
        strategy: 'RollingUpdate'
      },
      {
        name: 'user-service',
        namespace: 'production',
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
        unavailableReplicas: 0,
        age: '14d',
        images: ['node:20-alpine', 'redis:7-alpine'],
        labels: { app: 'user-service', tier: 'backend', 'app.kubernetes.io/instance': 'user-service-prod' },
        strategy: 'RollingUpdate',
        gitops: {
          manager: 'argocd',
          applicationName: 'user-service-prod',
          syncStatus: 'Synced'
        }
      },
      {
        name: 'payment-processor',
        namespace: 'production',
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
        unavailableReplicas: 0,
        age: '12d',
        images: ['golang:1.21-alpine'],
        labels: { app: 'payment-processor', tier: 'backend', 'kustomize.toolkit.fluxcd.io/name': 'payment-kustomization' },
        strategy: 'RollingUpdate',
        gitops: {
          manager: 'flux',
          applicationName: 'payment-kustomization',
          syncStatus: 'Synced'
        }
      },
      {
        name: 'frontend-web',
        namespace: 'production',
        replicas: 4,
        readyReplicas: 4,
        availableReplicas: 4,
        unavailableReplicas: 0,
        age: '20d',
        images: ['nginx:1.25-alpine'],
        labels: { app: 'frontend-web', tier: 'frontend' },
        strategy: 'RollingUpdate'
      },
      {
        name: 'staging-backend',
        namespace: 'staging',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
        unavailableReplicas: 0,
        age: '5d',
        images: ['node:20-alpine'],
        labels: { app: 'staging-backend' },
        strategy: 'RollingUpdate'
      },
      {
        name: 'prometheus-server',
        namespace: 'monitoring',
        replicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        unavailableReplicas: 0,
        age: '30d',
        images: ['prom/prometheus:v2.48.0'],
        labels: { app: 'prometheus' },
        strategy: 'Recreate'
      }
    ]

    // StatefulSets
    this.statefulSets = [
      {
        name: 'postgres-cluster',
        namespace: 'production',
        replicas: 3,
        readyReplicas: 3,
        currentReplicas: 3,
        age: '25d',
        images: ['postgres:16-alpine'],
        serviceName: 'postgres-headless',
        labels: { app: 'postgres', role: 'database' }
      },
      {
        name: 'redis-ha',
        namespace: 'production',
        replicas: 3,
        readyReplicas: 3,
        currentReplicas: 3,
        age: '20d',
        images: ['redis:7.2-alpine'],
        serviceName: 'redis-ha-service',
        labels: { app: 'redis-ha', role: 'cache' }
      },
      {
        name: 'elasticsearch-data',
        namespace: 'monitoring',
        replicas: 2,
        readyReplicas: 2,
        currentReplicas: 2,
        age: '30d',
        images: ['docker.elastic.co/elasticsearch/elasticsearch:8.11.0'],
        serviceName: 'elasticsearch-headless',
        labels: { app: 'elasticsearch', role: 'logging' }
      }
    ]

    // DaemonSets
    this.daemonSets = [
      {
        name: 'node-exporter',
        namespace: 'monitoring',
        desiredNumberScheduled: 4,
        currentNumberScheduled: 4,
        numberReady: 4,
        numberAvailable: 4,
        age: '40d',
        images: ['prom/node-exporter:v1.7.0'],
        labels: { app: 'node-exporter' }
      },
      {
        name: 'fluentbit-collector',
        namespace: 'monitoring',
        desiredNumberScheduled: 4,
        currentNumberScheduled: 4,
        numberReady: 4,
        numberAvailable: 4,
        age: '35d',
        images: ['fluent/fluent-bit:2.2.0'],
        labels: { app: 'fluentbit' }
      },
      {
        name: 'cilium-cni',
        namespace: 'kube-system',
        desiredNumberScheduled: 4,
        currentNumberScheduled: 4,
        numberReady: 4,
        numberAvailable: 4,
        age: '45d',
        images: ['quay.io/cilium/cilium:v1.14.4'],
        labels: { 'k8s-app': 'cilium' }
      }
    ]

    // Jobs
    this.jobs = [
      {
        name: 'database-migration-v2-4',
        namespace: 'production',
        completions: 1,
        succeeded: 1,
        failed: 0,
        active: 0,
        startTime: new Date(Date.now() - 4 * 3600000).toISOString(),
        completionTime: new Date(Date.now() - 4 * 3600000 + 45000).toISOString(),
        duration: '45s',
        status: 'Complete',
        images: ['migrate/migrate:v4.16.2'],
        labels: { job: 'db-migration' }
      },
      {
        name: 'nightly-analytics-aggregation',
        namespace: 'production',
        completions: 1,
        succeeded: 1,
        failed: 0,
        active: 0,
        startTime: new Date(Date.now() - 14 * 3600000).toISOString(),
        completionTime: new Date(Date.now() - 14 * 3600000 + 320000).toISOString(),
        duration: '5m 20s',
        status: 'Complete',
        images: ['python:3.11-slim'],
        labels: { job: 'analytics' }
      }
    ]

    // CronJobs
    this.cronJobs = [
      {
        name: 'nightly-database-backup',
        namespace: 'production',
        schedule: '0 2 * * *',
        suspend: false,
        activeJobs: 0,
        lastScheduleTime: new Date(Date.now() - 14 * 3600000).toISOString(),
        lastSuccessfulTime: new Date(Date.now() - 14 * 3600000 + 120000).toISOString(),
        images: ['postgres:16-alpine'],
        age: '28d',
        labels: { cron: 'backup' }
      },
      {
        name: 'ssl-certificate-renewer',
        namespace: 'kube-system',
        schedule: '0 0 1 * *',
        suspend: false,
        activeJobs: 0,
        lastScheduleTime: new Date(Date.now() - 15 * 86400000).toISOString(),
        lastSuccessfulTime: new Date(Date.now() - 15 * 86400000).toISOString(),
        images: ['cert-manager/cert-manager:v1.13.0'],
        age: '40d',
        labels: { cron: 'cert-renewal' }
      },
      {
        name: 'log-retention-cleanup',
        namespace: 'monitoring',
        schedule: '0 */6 * * *',
        suspend: false,
        activeJobs: 0,
        lastScheduleTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        lastSuccessfulTime: new Date(Date.now() - 2 * 3600000 + 15000).toISOString(),
        images: ['curator:8.0.0'],
        age: '30d',
        labels: { cron: 'cleanup' }
      }
    ]

    // Services
    this.services = [
      {
        name: 'api-gateway-service',
        namespace: 'production',
        type: 'LoadBalancer',
        clusterIP: '10.96.10.1',
        externalIPs: ['203.0.113.100'],
        ports: '80:30080/TCP, 443:30443/TCP',
        age: '18d',
        selector: { app: 'api-gateway' }
      },
      {
        name: 'user-service',
        namespace: 'production',
        type: 'ClusterIP',
        clusterIP: '10.96.10.2',
        externalIPs: [],
        ports: '8080/TCP, 9090/TCP',
        age: '14d',
        selector: { app: 'user-service' }
      },
      {
        name: 'payment-processor',
        namespace: 'production',
        type: 'ClusterIP',
        clusterIP: '10.96.10.3',
        externalIPs: [],
        ports: '8000/TCP',
        age: '12d',
        selector: { app: 'payment-processor' }
      },
      {
        name: 'frontend-web-service',
        namespace: 'production',
        type: 'ClusterIP',
        clusterIP: '10.96.10.4',
        externalIPs: [],
        ports: '80/TCP',
        age: '20d',
        selector: { app: 'frontend-web' }
      },
      {
        name: 'postgres-headless',
        namespace: 'production',
        type: 'ClusterIP',
        clusterIP: 'None',
        externalIPs: [],
        ports: '5432/TCP',
        age: '25d',
        selector: { app: 'postgres' }
      },
      {
        name: 'prometheus-k8s',
        namespace: 'monitoring',
        type: 'NodePort',
        clusterIP: '10.96.20.1',
        externalIPs: [],
        ports: '9090:30909/TCP',
        age: '30d',
        selector: { app: 'prometheus' }
      }
    ]

    // Ingresses
    this.ingresses = [
      {
        name: 'production-main-ingress',
        namespace: 'production',
        hosts: ['app.kubernetes.io', 'api.kubernetes.io'],
        paths: [
          { path: '/api', backend: 'api-gateway-service', port: 80 },
          { path: '/', backend: 'frontend-web-service', port: 80 }
        ],
        loadBalancerIP: '203.0.113.100',
        tls: true,
        age: '18d'
      },
      {
        name: 'monitoring-ingress',
        namespace: 'monitoring',
        hosts: ['grafana.internal.k8s'],
        paths: [
          { path: '/', backend: 'prometheus-k8s', port: 9090 }
        ],
        tls: false,
        age: '30d'
      }
    ]

    // ConfigMaps
    this.configMaps = [
      {
        name: 'api-gateway-config',
        namespace: 'production',
        data: {
          'envoy.yaml': 'admin:\n  address:\n    socket_address: { address: 127.0.0.1, port_value: 9901 }\nstatic_resources:\n  listeners: []',
          'cors.json': '{"allowedOrigins": ["*"], "allowedMethods": ["GET", "POST", "PUT", "DELETE"]}'
        },
        age: '18d'
      },
      {
        name: 'app-settings',
        namespace: 'production',
        data: {
          'LOG_LEVEL': 'info',
          'ENABLE_CACHE': 'true',
          'TIMEOUT_SECONDS': '30',
          'MAX_CONNECTIONS': '1000'
        },
        age: '22d'
      },
      {
        name: 'prometheus-config',
        namespace: 'monitoring',
        data: {
          'prometheus.yml': 'global:\n  scrape_interval: 15s\nscrape_configs:\n  - job_name: "kubernetes-nodes"\n    kubernetes_sd_configs:\n      - role: node'
        },
        age: '30d'
      }
    ]

    // Secrets
    this.secrets = [
      {
        name: 'database-credentials',
        namespace: 'production',
        type: 'Opaque',
        data: {
          'DB_USER': 'cG9zdGdyZXM=',
          'DB_PASSWORD': 'U3VwZXJTZWNyZXRQYXNzMjAyNCE=',
          'DB_NAME': 'cHJvZHVjdGlvbl9kYg=='
        },
        age: '25d'
      },
      {
        name: 'jwt-signing-key',
        namespace: 'production',
        type: 'Opaque',
        data: {
          'PRIVATE_KEY': 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVB...',
          'PUBLIC_KEY': 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVG...'
        },
        age: '18d'
      },
      {
        name: 'tls-cert-production',
        namespace: 'production',
        type: 'kubernetes.io/tls',
        data: {
          'tls.crt': 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVsVENDQTMya0F3SUJBZ0lVSXlV...',
          'tls.key': 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcw...'
        },
        age: '18d'
      }
    ]

    // Storage: PVs, PVCs, StorageClasses
    this.storageClasses = [
      {
        name: 'standard-gp3',
        provisioner: 'ebs.csi.aws.com',
        reclaimPolicy: 'Delete',
        volumeBindingMode: 'WaitForFirstConsumer',
        allowVolumeExpansion: true,
        isDefault: true,
        age: '45d'
      },
      {
        name: 'fast-nvme-ssd',
        provisioner: 'kubernetes.io/no-provisioner',
        reclaimPolicy: 'Retain',
        volumeBindingMode: 'Immediate',
        allowVolumeExpansion: false,
        isDefault: false,
        age: '40d'
      },
      {
        name: 'shared-nfs-store',
        provisioner: 'nfs.csi.k8s.io',
        reclaimPolicy: 'Retain',
        volumeBindingMode: 'Immediate',
        allowVolumeExpansion: true,
        isDefault: false,
        age: '30d'
      }
    ]

    this.persistentVolumes = [
      {
        name: 'pv-postgres-data-01',
        capacity: '100Gi',
        accessModes: ['ReadWriteOnce'],
        reclaimPolicy: 'Retain',
        status: 'Bound',
        claim: 'production/postgres-data-claim',
        storageClass: 'fast-nvme-ssd',
        age: '25d',
        volumeType: 'Local SSD'
      },
      {
        name: 'pv-redis-state-01',
        capacity: '20Gi',
        accessModes: ['ReadWriteOnce'],
        reclaimPolicy: 'Delete',
        status: 'Bound',
        claim: 'production/redis-data-claim',
        storageClass: 'standard-gp3',
        age: '20d',
        volumeType: 'AWS EBS gp3'
      },
      {
        name: 'pv-shared-media-volume',
        capacity: '500Gi',
        accessModes: ['ReadWriteMany'],
        reclaimPolicy: 'Retain',
        status: 'Bound',
        claim: 'production/media-assets-pvc',
        storageClass: 'shared-nfs-store',
        age: '18d',
        volumeType: 'NFS Storage'
      },
      {
        name: 'pv-elasticsearch-data-01',
        capacity: '250Gi',
        accessModes: ['ReadWriteOnce'],
        reclaimPolicy: 'Delete',
        status: 'Bound',
        claim: 'monitoring/elasticsearch-pvc',
        storageClass: 'standard-gp3',
        age: '30d',
        volumeType: 'AWS EBS gp3'
      },
      {
        name: 'pv-backup-staging-01',
        capacity: '50Gi',
        accessModes: ['ReadWriteOnce'],
        reclaimPolicy: 'Delete',
        status: 'Available',
        claim: '-',
        storageClass: 'standard-gp3',
        age: '10d',
        volumeType: 'AWS EBS gp3'
      }
    ]

    this.persistentVolumeClaims = [
      {
        name: 'postgres-data-claim',
        namespace: 'production',
        status: 'Bound',
        volume: 'pv-postgres-data-01',
        capacity: '100Gi',
        accessModes: ['ReadWriteOnce'],
        storageClass: 'fast-nvme-ssd',
        age: '25d',
        usedCapacity: '62.4Gi'
      },
      {
        name: 'redis-data-claim',
        namespace: 'production',
        status: 'Bound',
        volume: 'pv-redis-state-01',
        capacity: '20Gi',
        accessModes: ['ReadWriteOnce'],
        storageClass: 'standard-gp3',
        age: '20d',
        usedCapacity: '8.1Gi'
      },
      {
        name: 'media-assets-pvc',
        namespace: 'production',
        status: 'Bound',
        volume: 'pv-shared-media-volume',
        capacity: '500Gi',
        accessModes: ['ReadWriteMany'],
        storageClass: 'shared-nfs-store',
        age: '18d',
        usedCapacity: '142.6Gi'
      },
      {
        name: 'elasticsearch-pvc',
        namespace: 'monitoring',
        status: 'Bound',
        volume: 'pv-elasticsearch-data-01',
        capacity: '250Gi',
        accessModes: ['ReadWriteOnce'],
        storageClass: 'standard-gp3',
        age: '30d',
        usedCapacity: '184.2Gi'
      }
    ]

    // Helm Releases & Catalog
    this.helmReleases = [
      {
        name: 'ingress-nginx',
        namespace: 'kube-system',
        revision: 3,
        updated: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: 'deployed',
        chart: 'ingress-nginx-4.9.0',
        appVersion: 'v1.9.4',
        description: 'Ingress controller for Kubernetes using NGINX'
      },
      {
        name: 'cert-manager',
        namespace: 'kube-system',
        revision: 2,
        updated: new Date(Date.now() - 10 * 86400000).toISOString(),
        status: 'deployed',
        chart: 'cert-manager-v1.13.3',
        appVersion: 'v1.13.3',
        description: 'Cloud native certificate management'
      },
      {
        name: 'kube-prometheus-stack',
        namespace: 'monitoring',
        revision: 5,
        updated: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'deployed',
        chart: 'kube-prometheus-stack-55.5.0',
        appVersion: 'v0.70.0',
        description: 'Prometheus operator, Grafana dashboards and alertmanager'
      },
      {
        name: 'redis-ha-cluster',
        namespace: 'production',
        revision: 1,
        updated: new Date(Date.now() - 20 * 86400000).toISOString(),
        status: 'deployed',
        chart: 'redis-ha-4.24.4',
        appVersion: '7.2.3',
        description: 'Highly available Redis cluster with Sentinel'
      }
    ]

    this.helmCharts = [
      {
        name: 'ingress-nginx',
        version: '4.9.0',
        appVersion: 'v1.9.4',
        description: 'High-performance HTTP/HTTPS ingress reverse proxy',
        repository: 'https://kubernetes.github.io/ingress-nginx',
        installed: true
      },
      {
        name: 'cert-manager',
        version: 'v1.13.3',
        appVersion: 'v1.13.3',
        description: 'Automated TLS certificate renewal via Let\'s Encrypt / Vault',
        repository: 'https://charts.jetstack.io',
        installed: true
      },
      {
        name: 'kube-prometheus-stack',
        version: '55.5.0',
        appVersion: 'v0.70.0',
        description: 'Complete Kubernetes monitoring stack with Grafana dashboards',
        repository: 'https://prometheus-community.github.io/helm-charts',
        installed: true
      },
      {
        name: 'argo-cd',
        version: '5.53.0',
        appVersion: 'v2.9.3',
        description: 'Declarative GitOps continuous delivery tool for Kubernetes',
        repository: 'https://argoproj.github.io/argo-helm',
        installed: false
      },
      {
        name: 'vault',
        version: '0.27.0',
        appVersion: '1.15.2',
        description: 'HashiCorp Vault secret management and dynamic encryption keys',
        repository: 'https://helm.releases.hashicorp.com',
        installed: false
      },
      {
        name: 'traefik',
        version: '26.0.0',
        appVersion: 'v2.10.7',
        description: 'Modern cloud native HTTP reverse proxy and load balancer',
        repository: 'https://traefik.github.io/charts',
        installed: false
      },
      {
        name: 'rabbitmq',
        version: '12.8.0',
        appVersion: '3.12.12',
        description: 'Enterprise AMQP message broker and streaming cluster',
        repository: 'https://charts.bitnami.com/bitnami',
        installed: false
      },
      {
        name: 'mongodb',
        version: '14.4.0',
        appVersion: '7.0.4',
        description: 'Scalable NoSQL document database with replica set support',
        repository: 'https://charts.bitnami.com/bitnami',
        installed: false
      }
    ]

    // Generate Pods
    this.regeneratePods()

    // Events
    this.events = [
      {
        id: 'evt-1',
        type: 'Normal',
        reason: 'ScalingReplicaSet',
        message: 'Scaled up replica set api-gateway-7b9f8d6c to 4',
        involvedObject: { kind: 'Deployment', name: 'api-gateway', namespace: 'production' },
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: 'evt-2',
        type: 'Normal',
        reason: 'Started',
        message: 'Started container envoyproxy in pod api-gateway-7b9f8d6c-z9q12',
        involvedObject: { kind: 'Pod', name: 'api-gateway-7b9f8d6c-z9q12', namespace: 'production' },
        timestamp: new Date(Date.now() - 4 * 60000).toISOString()
      },
      {
        id: 'evt-3',
        type: 'Normal',
        reason: 'JobCompleted',
        message: 'Job database-migration-v2-4 completed successfully',
        involvedObject: { kind: 'Job', name: 'database-migration-v2-4', namespace: 'production' },
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 'evt-4',
        type: 'Normal',
        reason: 'NodeReady',
        message: 'Node k8s-worker-node-03 is Ready and available for scheduling',
        involvedObject: { kind: 'Node', name: 'k8s-worker-node-03', namespace: '' },
        timestamp: new Date(Date.now() - 20 * 60000).toISOString()
      }
    ]

    this.initialized = true
  }

  private regeneratePods() {
    const newPods: Pod[] = []
    const nodeNames = this.nodes.map(n => n.name)

    // Generate pods for Deployments
    for (const dep of this.deployments) {
      for (let i = 0; i < dep.replicas; i++) {
        const hash = Math.random().toString(36).substring(2, 7)
        const node = nodeNames[(i + 1) % nodeNames.length]
        newPods.push({
          name: `${dep.name}-${hash}`,
          namespace: dep.namespace,
          status: 'Running',
          phase: 'Running',
          node,
          ip: `10.244.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 250) + 2}`,
          createdAt: dep.age,
          restarts: Math.floor(Math.random() * 2),
          ready: '1/1',
          containers: dep.images.map(img => ({
            name: img.split(':')[0].split('/').pop() || 'app',
            image: img,
            ready: true,
            restartCount: 0,
            ports: [8080]
          })),
          labels: dep.labels
        })
      }
    }

    // Generate pods for StatefulSets
    for (const ss of this.statefulSets) {
      for (let i = 0; i < ss.replicas; i++) {
        const node = nodeNames[i % nodeNames.length]
        newPods.push({
          name: `${ss.name}-${i}`,
          namespace: ss.namespace,
          status: 'Running',
          phase: 'Running',
          node,
          ip: `10.244.${Math.floor(Math.random() * 5) + 1}.${10 + i}`,
          createdAt: ss.age,
          restarts: 0,
          ready: '1/1',
          containers: ss.images.map(img => ({
            name: ss.name,
            image: img,
            ready: true,
            restartCount: 0
          })),
          labels: ss.labels
        })
      }
    }

    // Generate pods for DaemonSets
    for (const ds of this.daemonSets) {
      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i].name
        const nodeSuffix = node.replace(/^k8s-/, '')
        newPods.push({
          name: `${ds.name}-${nodeSuffix}`,
          namespace: ds.namespace,
          status: 'Running',
          phase: 'Running',
          node,
          ip: `10.244.${i + 1}.5`,
          createdAt: ds.age,
          restarts: 0,
          ready: '1/1',
          containers: ds.images.map(img => ({
            name: ds.name,
            image: img,
            ready: true,
            restartCount: 0
          })),
          labels: ds.labels
        })
      }
    }

    this.pods = newPods
  }

  // --- Read Operations ---
  getClusterInfo(): ClusterInfo {
    return {
      name: 'production-k8s-cluster',
      version: 'v1.28.2',
      nodes: this.nodes.length,
      pods: this.pods.length,
      services: this.services.length,
      namespaces: this.namespaces.length,
      cpuUsage: 42.5,
      memoryUsage: 56.8
    }
  }

  getPods(namespace?: string): Pod[] {
    return namespace && namespace !== 'all'
      ? this.pods.filter(p => p.namespace === namespace)
      : this.pods
  }

  getDeployments(namespace?: string): Deployment[] {
    return namespace && namespace !== 'all'
      ? this.deployments.filter(d => d.namespace === namespace)
      : this.deployments
  }

  getStatefulSets(namespace?: string): StatefulSet[] {
    return namespace && namespace !== 'all'
      ? this.statefulSets.filter(s => s.namespace === namespace)
      : this.statefulSets
  }

  getDaemonSets(namespace?: string): DaemonSet[] {
    return namespace && namespace !== 'all'
      ? this.daemonSets.filter(d => d.namespace === namespace)
      : this.daemonSets
  }

  getJobs(namespace?: string): Job[] {
    return namespace && namespace !== 'all'
      ? this.jobs.filter(j => j.namespace === namespace)
      : this.jobs
  }

  getCronJobs(namespace?: string): CronJob[] {
    return namespace && namespace !== 'all'
      ? this.cronJobs.filter(c => c.namespace === namespace)
      : this.cronJobs
  }

  getServices(namespace?: string): Service[] {
    return namespace && namespace !== 'all'
      ? this.services.filter(s => s.namespace === namespace)
      : this.services
  }

  getIngresses(namespace?: string): Ingress[] {
    return namespace && namespace !== 'all'
      ? this.ingresses.filter(i => i.namespace === namespace)
      : this.ingresses
  }

  getConfigMaps(namespace?: string): ConfigMap[] {
    return namespace && namespace !== 'all'
      ? this.configMaps.filter(c => c.namespace === namespace)
      : this.configMaps
  }

  getSecrets(namespace?: string): Secret[] {
    return namespace && namespace !== 'all'
      ? this.secrets.filter(s => s.namespace === namespace)
      : this.secrets
  }

  getNodes(): Node[] {
    return this.nodes
  }

  getNamespaces(): Namespace[] {
    return this.namespaces
  }

  getEvents(namespace?: string): ResourceEvent[] {
    return namespace && namespace !== 'all'
      ? this.events.filter(e => e.involvedObject.namespace === namespace)
      : this.events
  }

  // --- Storage ---
  getPersistentVolumes(): PersistentVolume[] {
    return this.persistentVolumes
  }

  getPersistentVolumeClaims(namespace?: string): PersistentVolumeClaim[] {
    return namespace && namespace !== 'all'
      ? this.persistentVolumeClaims.filter(p => p.namespace === namespace)
      : this.persistentVolumeClaims
  }

  getStorageClasses(): StorageClass[] {
    return this.storageClasses
  }

  // --- Helm ---
  getHelmReleases(namespace?: string): HelmRelease[] {
    return namespace && namespace !== 'all'
      ? this.helmReleases.filter(r => r.namespace === namespace)
      : this.helmReleases
  }

  getHelmCharts(): HelmChart[] {
    return this.helmCharts
  }

  installHelmChart(chartName: string, releaseName: string, namespace: string): HelmRelease {
    const chart = this.helmCharts.find(c => c.name === chartName)
    const newRelease: HelmRelease = {
      name: releaseName || `${chartName}-app`,
      namespace: namespace || 'default',
      revision: 1,
      updated: new Date().toISOString(),
      status: 'deployed',
      chart: `${chartName}-${chart?.version || '1.0.0'}`,
      appVersion: chart?.appVersion || 'v1.0.0',
      description: chart?.description || 'Installed via Helm Marketplace'
    }

    this.helmReleases.unshift(newRelease)
    if (chart) chart.installed = true

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'HelmInstall',
      message: `Installed Helm chart ${chartName} as release ${newRelease.name} in ${namespace}`,
      involvedObject: { kind: 'HelmRelease', name: newRelease.name, namespace },
      timestamp: new Date().toISOString()
    })

    return newRelease
  }

  rollbackHelmRelease(releaseName: string, namespace: string, revision: number): boolean {
    const rel = this.helmReleases.find(r => r.name === releaseName && r.namespace === namespace)
    if (!rel) return false
    rel.revision += 1
    rel.updated = new Date().toISOString()
    rel.status = 'deployed'

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'HelmRollback',
      message: `Rolled back release ${releaseName} to revision ${revision}`,
      involvedObject: { kind: 'HelmRelease', name: releaseName, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  uninstallHelmRelease(releaseName: string, namespace: string): boolean {
    const len = this.helmReleases.length
    this.helmReleases = this.helmReleases.filter(r => !(r.name === releaseName && r.namespace === namespace))
    return this.helmReleases.length !== len
  }

  // --- Security & CIS Benchmark Scanner ---
  getSecurityReport(): SecurityReport {
    const findings: SecurityFinding[] = [
      {
        id: 'sec-1',
        category: 'Workload',
        severity: 'HIGH',
        title: 'Container running without memory resource limits',
        resourceKind: 'Deployment',
        resourceName: 'staging-backend',
        namespace: 'staging',
        remediation: 'Set resources.limits.memory and resources.requests.memory in container spec',
        impact: 'Pod may cause node memory exhaustion (OOMKill) affecting neighboring workloads.'
      },
      {
        id: 'sec-2',
        category: 'Workload',
        severity: 'MEDIUM',
        title: 'Container allowed root user privilege escalation',
        resourceKind: 'Deployment',
        resourceName: 'frontend-web',
        namespace: 'production',
        remediation: 'Add securityContext: { allowPrivilegeEscalation: false, runAsNonRoot: true }',
        impact: 'Compromised container processes can escalate to root permissions.'
      },
      {
        id: 'sec-3',
        category: 'Network',
        severity: 'MEDIUM',
        title: 'Ingress endpoint lacks TLS encryption certificate',
        resourceKind: 'Ingress',
        resourceName: 'monitoring-ingress',
        namespace: 'monitoring',
        remediation: 'Configure TLS secret certificate in ingress spec.tls block',
        impact: 'HTTP plain-text telemetry traffic exposed across public routes.'
      },
      {
        id: 'sec-4',
        category: 'RBAC',
        severity: 'LOW',
        title: 'Default ServiceAccount has automountServiceAccountToken enabled',
        resourceKind: 'Namespace',
        resourceName: 'default',
        namespace: 'default',
        remediation: 'Set automountServiceAccountToken: false on unused ServiceAccounts',
        impact: 'API tokens automatically mounted into pods without explicit RBAC requirements.'
      },
      {
        id: 'sec-5',
        category: 'Configuration',
        severity: 'LOW',
        title: 'ConfigMap key loaded without hash versioning',
        resourceKind: 'ConfigMap',
        resourceName: 'app-settings',
        namespace: 'production',
        remediation: 'Use Kustomize configMapGenerator or immutable: true',
        impact: 'Hot-reloads may lead to desynchronized application state across replicas.'
      }
    ]

    return {
      overallScore: 88,
      grade: 'A',
      scannedResources: 48,
      passedChecks: 43,
      failedChecks: 5,
      findings,
      categoryScores: {
        workload: 85,
        network: 90,
        rbac: 92,
        config: 86
      }
    }
  }

  // --- Interactive Terminal Exec Simulation ---
  execCommand(podName: string, namespace: string, container: string = 'main', cmd: string): { output: string; exitCode: number } {
    const c = cmd.trim().toLowerCase()
    const time = new Date().toLocaleTimeString()

    if (!c) {
      return { output: '', exitCode: 0 }
    }

    if (c === 'clear') {
      return { output: '__CLEAR__', exitCode: 0 }
    }

    if (c === 'help') {
      return {
        output: `Available shell diagnostics commands:\n  • ps aux           - View active processes in container\n  • top              - Inspect realtime container CPU/memory usage\n  • df -h            - Check mounted filesystems and volumes\n  • env              - List runtime environment variables\n  • netstat -tlpn    - Display open TCP/UDP network listening ports\n  • cat /etc/os-release - Inspect base container Linux OS\n  • curl <url>       - Test HTTP connectivity\n  • uname -a         - Print container kernel details\n  • clear            - Clear terminal buffer`,
        exitCode: 0
      }
    }

    if (c === 'ps aux' || c === 'ps') {
      return {
        output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.2  0.8 112840 24800 ?        Ssl  12:00   0:04 node server.js\nnextjs      18  0.0  0.2  18420  4210 ?        S    12:01   0:00 dumb-init -- /app\nnextjs      42  0.0  0.1   8200  2100 pts/0    Ss   ${time}   0:00 /bin/sh`,
        exitCode: 0
      }
    }

    if (c === 'top') {
      return {
        output: `Mem: 24800K used, 512000K free, 8200K shrd, 1420K buff, 124800K cached\nCPU:   2.1% usr   1.2% sys   0.0% nic  96.7% idle   0.0% io   0.0% irq\nLoad average: 0.14 0.08 0.03 2/184 92\n\n  PID USER     STATUS   VSZ  PPID %CPU %MEM COMMAND\n    1 nextjs   S       112M     0  2.1  4.8 node server.js\n   42 nextjs   R       8200     1  0.0  0.2 top`,
        exitCode: 0
      }
    }

    if (c === 'df -h' || c === 'df') {
      return {
        output: `Filesystem                Size      Used Available Use% Mounted on\noverlay                 100.0G     24.2G     75.8G  24% /\ntmpfs                    64.0M         0     64.0M   0% /dev\ntmpfs                    15.5G         0     15.5G   0% /sys/fs/cgroup\n/dev/nvme0n1p1          100.0G     24.2G     75.8G  24% /etc/hosts\n/dev/nvme1n1             20.0G      8.1G     11.9G  41% /var/data`,
        exitCode: 0
      }
    }

    if (c === 'env') {
      return {
        output: `KUBERNETES_SERVICE_HOST=10.96.0.1\nKUBERNETES_SERVICE_PORT=443\nKUBERNETES_PORT=tcp://10.96.0.1:443\nNODE_ENV=production\nHOSTNAME=${podName}\nPORT=8080\nLOG_LEVEL=info\nAPP_NAMESPACE=${namespace}\nCONTAINER_NAME=${container}\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
        exitCode: 0
      }
    }

    if (c.startsWith('cat /etc/os-release') || c.startsWith('cat /etc/issue')) {
      return {
        output: `NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.20.0\nPRETTY_NAME="Alpine Linux v3.20"\nHOME_URL="https://alpinelinux.org/"\nBUG_REPORT_URL="https://gitlab.alpinelinux.org/alpine/aports/-/issues"`,
        exitCode: 0
      }
    }

    if (c.startsWith('cat /etc/resolv.conf')) {
      return {
        output: `search ${namespace}.svc.cluster.local svc.cluster.local cluster.local\nnameserver 10.96.0.10\noptions ndots:5`,
        exitCode: 0
      }
    }

    if (c === 'netstat -tlpn' || c === 'netstat') {
      return {
        output: `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name\ntcp        0      0 0.0.0.0:8080            0.0.0.0:*               LISTEN      1/node\ntcp        0      0 127.0.0.1:9090          0.0.0.0:*               LISTEN      1/node`,
        exitCode: 0
      }
    }

    if (c === 'uname -a') {
      return {
        output: `Linux ${podName} 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 Linux`,
        exitCode: 0
      }
    }

    if (c === 'whoami') {
      return { output: `nextjs (uid=1001, gid=1001)`, exitCode: 0 }
    }

    if (c === 'pwd') {
      return { output: `/app`, exitCode: 0 }
    }

    if (c.startsWith('ls')) {
      return {
        output: `package.json  package-lock.json  public  server.js  .next  node_modules`,
        exitCode: 0
      }
    }

    if (c.startsWith('curl')) {
      return {
        output: `HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 42\nDate: ${new Date().toUTCString()}\n\n{"status":"healthy","uptime":38420.5}`,
        exitCode: 0
      }
    }

    return {
      output: `Executed: ${cmd}\n[stdout] Command completed successfully in container ${container} (pod: ${podName})`,
      exitCode: 0
    }
  }

  // --- Mutating Actions ---
  scaleDeployment(name: string, namespace: string, replicas: number): boolean {
    const dep = this.deployments.find(d => d.name === name && d.namespace === namespace)
    if (!dep) return false
    dep.replicas = replicas
    dep.readyReplicas = replicas
    dep.availableReplicas = replicas
    dep.unavailableReplicas = 0
    this.regeneratePods()

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'ScalingReplicaSet',
      message: `Scaled deployment ${name} to ${replicas} replicas`,
      involvedObject: { kind: 'Deployment', name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  scaleStatefulSet(name: string, namespace: string, replicas: number): boolean {
    const ss = this.statefulSets.find(s => s.name === name && s.namespace === namespace)
    if (!ss) return false
    ss.replicas = replicas
    ss.readyReplicas = replicas
    ss.currentReplicas = replicas
    this.regeneratePods()

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'ScalingStatefulSet',
      message: `Scaled statefulset ${name} to ${replicas} replicas`,
      involvedObject: { kind: 'StatefulSet', name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  restartDeployment(name: string, namespace: string): boolean {
    const dep = this.deployments.find(d => d.name === name && d.namespace === namespace)
    if (!dep) return false
    
    this.pods
      .filter(p => p.namespace === namespace && p.name.startsWith(name))
      .forEach(p => {
        p.restarts += 1
        p.createdAt = 'Just now'
      })

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'Restarted',
      message: `Rolling restart initiated for deployment ${name}`,
      involvedObject: { kind: 'Deployment', name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  restartDaemonSet(name: string, namespace: string): boolean {
    const ds = this.daemonSets.find(d => d.name === name && d.namespace === namespace)
    if (!ds) return false

    this.pods
      .filter(p => p.namespace === namespace && p.name.startsWith(name))
      .forEach(p => {
        p.restarts += 1
        p.createdAt = 'Just now'
      })

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'Restarted',
      message: `Rolling restart initiated for daemonset ${name}`,
      involvedObject: { kind: 'DaemonSet', name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  restartPod(name: string, namespace: string): boolean {
    const pod = this.pods.find(p => p.name === name && p.namespace === namespace)
    if (!pod) return false
    pod.restarts += 1
    pod.status = 'Running'
    pod.createdAt = 'Just now'

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'Restarted',
      message: `Pod ${name} was manually restarted`,
      involvedObject: { kind: 'Pod', name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  deletePod(name: string, namespace: string): boolean {
    const initialLen = this.pods.length
    this.pods = this.pods.filter(p => !(p.name === name && p.namespace === namespace))
    if (this.pods.length === initialLen) return false

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'Killing',
      message: `Stopping container in pod ${name}`,
      involvedObject: { kind: 'Pod', name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  deleteResource(kind: string, name: string, namespace: string): boolean {
    const k = kind.toLowerCase()
    if (k === 'deployment' || k === 'deployments') {
      this.deployments = this.deployments.filter(d => !(d.name === name && d.namespace === namespace))
      this.pods = this.pods.filter(p => !(p.namespace === namespace && p.name.startsWith(name)))
    } else if (k === 'statefulset' || k === 'statefulsets') {
      this.statefulSets = this.statefulSets.filter(s => !(s.name === name && s.namespace === namespace))
      this.pods = this.pods.filter(p => !(p.namespace === namespace && p.name.startsWith(name)))
    } else if (k === 'daemonset' || k === 'daemonsets') {
      this.daemonSets = this.daemonSets.filter(d => !(d.name === name && d.namespace === namespace))
      this.pods = this.pods.filter(p => !(p.namespace === namespace && p.name.startsWith(name)))
    } else if (k === 'job' || k === 'jobs') {
      this.jobs = this.jobs.filter(j => !(j.name === name && j.namespace === namespace))
    } else if (k === 'cronjob' || k === 'cronjobs') {
      this.cronJobs = this.cronJobs.filter(c => !(c.name === name && c.namespace === namespace))
    } else if (k === 'service' || k === 'services') {
      this.services = this.services.filter(s => !(s.name === name && s.namespace === namespace))
    } else if (k === 'ingress' || k === 'ingresses') {
      this.ingresses = this.ingresses.filter(i => !(i.name === name && i.namespace === namespace))
    } else if (k === 'configmap' || k === 'configmaps') {
      this.configMaps = this.configMaps.filter(c => !(c.name === name && c.namespace === namespace))
    } else if (k === 'secret' || k === 'secrets') {
      this.secrets = this.secrets.filter(s => !(s.name === name && s.namespace === namespace))
    } else if (k === 'persistentvolumeclaim' || k === 'pvc') {
      this.persistentVolumeClaims = this.persistentVolumeClaims.filter(p => !(p.name === name && p.namespace === namespace))
    } else if (k === 'persistentvolume' || k === 'pv') {
      this.persistentVolumes = this.persistentVolumes.filter(p => p.name !== name)
    } else if (k === 'pod' || k === 'pods') {
      return this.deletePod(name, namespace)
    }

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'Deleted',
      message: `Deleted ${kind} ${name} in namespace ${namespace}`,
      involvedObject: { kind, name, namespace },
      timestamp: new Date().toISOString()
    })
    return true
  }

  triggerCronJob(name: string, namespace: string): Job | null {
    const cj = this.cronJobs.find(c => c.name === name && c.namespace === namespace)
    if (!cj) return null

    const jobName = `${name}-manual-${Math.floor(Date.now() / 1000)}`
    const newJob: Job = {
      name: jobName,
      namespace,
      completions: 1,
      succeeded: 1,
      failed: 0,
      active: 0,
      startTime: new Date().toISOString(),
      completionTime: new Date(Date.now() + 15000).toISOString(),
      duration: '15s',
      status: 'Complete',
      images: cj.images,
      labels: { ...cj.labels, 'triggered-by': 'dashboard-manual' }
    }

    this.jobs.unshift(newJob)
    cj.lastScheduleTime = new Date().toISOString()
    cj.lastSuccessfulTime = new Date().toISOString()

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'SuccessfulCreate',
      message: `Created job ${jobName} from CronJob ${name}`,
      involvedObject: { kind: 'CronJob', name, namespace },
      timestamp: new Date().toISOString()
    })
    return newJob
  }

  toggleCronJobSuspend(name: string, namespace: string): boolean {
    const cj = this.cronJobs.find(c => c.name === name && c.namespace === namespace)
    if (!cj) return false
    cj.suspend = !cj.suspend
    return true
  }

  cordonNode(name: string, cordon: boolean): boolean {
    const node = this.nodes.find(n => n.name === name)
    if (!node) return false
    node.status = cordon ? 'SchedulingDisabled' : 'Ready'

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: cordon ? 'Cordon' : 'Uncordon',
      message: `Node ${name} marked as ${cordon ? 'unschedulable' : 'schedulable'}`,
      involvedObject: { kind: 'Node', name, namespace: '' },
      timestamp: new Date().toISOString()
    })
    return true
  }

  drainNode(name: string): boolean {
    const node = this.nodes.find(n => n.name === name)
    if (!node) return false
    node.status = 'SchedulingDisabled'

    const otherNodes = this.nodes.filter(n => n.name !== name && n.status === 'Ready').map(n => n.name)
    if (otherNodes.length > 0) {
      this.pods.filter(p => p.node === name).forEach((p, idx) => {
        p.node = otherNodes[idx % otherNodes.length]
      })
    }

    this.events.unshift({
      id: `evt-${Date.now()}`,
      type: 'Normal',
      reason: 'Drain',
      message: `Drained all pods from node ${name}`,
      involvedObject: { kind: 'Node', name, namespace: '' },
      timestamp: new Date().toISOString()
    })
    return true
  }

  getPodLogs(name: string, namespace: string, container?: string): string {
    const time = new Date().toISOString()
    const containerName = container || 'main'
    return [
      `[${time}] [INFO]  Starting container ${containerName} for pod ${name} in namespace ${namespace}`,
      `[${time}] [INFO]  Initializing runtime environment and loading configuration...`,
      `[${time}] [INFO]  Mounted volumes verified: /etc/config, /var/secrets`,
      `[${time}] [INFO]  Connected to upstream service at 10.96.0.1:443`,
      `[${time}] [INFO]  Worker thread pool initialized with 8 threads`,
      `[${time}] [INFO]  HTTP Server listening on 0.0.0.0:8080 (readiness probe: /healthz)`,
      `[${time}] [DEBUG] GET /healthz 200 OK - 1.2ms`,
      `[${time}] [INFO]  Ready to process requests. Active workload: healthy`
    ].join('\n')
  }

  getYaml(kind: string, name: string, namespace: string): string {
    const k = kind.toLowerCase()
    return `apiVersion: ${k.includes('deployment') || k.includes('stateful') || k.includes('daemon') ? 'apps/v1' : k.includes('job') ? 'batch/v1' : 'v1'}
kind: ${kind}
metadata:
  name: ${name}
  namespace: ${namespace || 'default'}
  creationTimestamp: "${new Date().toISOString()}"
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/managed-by: k8s-dashboard
spec:
  # Resource specification for ${kind} ${name}
  # Managed dynamically via Kubernetes Dashboard
status:
  phase: Active
`
  }
}

// Global Singleton Store Instance for the app
const globalStore = (global as any).__k8s_store__ || new K8sStore()
if (process.env.NODE_ENV !== 'production') {
  ;(global as any).__k8s_store__ = globalStore
}

export const k8sStore: K8sStore = globalStore
