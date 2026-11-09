export interface DockerHubRepository {
  repoName: string;
  shortDescription: string;
  starCount: number;
  pullCount: number | string;
  isOfficial: boolean;
  isAutomated?: boolean;
  publisher?: string;
  categories?: string[];
  updatedAt?: string;
}

export interface DockerImageTag {
  name: string;
  size: number;
  digest: string;
  lastUpdated: string;
  architectures: string[];
  os: string[];
}

export interface DockerAccount {
  username: string;
  email?: string;
  token?: string;
  isConnected: boolean;
  registryUrl?: string;
  connectedAt?: string;
}

export interface DeployImageRequest {
  image: string;
  tag: string;
  name: string;
  namespace: string;
  workloadType: "deployment" | "pod";
  replicas?: number;
  port?: number;
  env?: { name: string; value: string }[];
  useImagePullSecret?: boolean;
  secretName?: string;
}

export interface DeployImageResponse {
  success: boolean;
  message: string;
  workloadType: "deployment" | "pod";
  name: string;
  namespace: string;
}

export const CURATED_DOCKER_IMAGES: DockerHubRepository[] = [
  {
    repoName: "nginx",
    shortDescription: "Official build of Nginx — high-performance HTTP server, reverse proxy and load balancer.",
    starCount: 21420,
    pullCount: "13.5B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Web Servers", "Networking"],
    updatedAt: "2026-11-05T10:52:18Z",
  },
  {
    repoName: "redis",
    shortDescription:
      "Redis is an open source, in-memory key-value data store used as a database, cache, and message broker.",
    starCount: 16890,
    pullCount: "10.1B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Databases", "Caching"],
    updatedAt: "2026-11-04T14:22:10Z",
  },
  {
    repoName: "postgres",
    shortDescription: "The PostgreSQL object-relational database system provides reliability and data integrity.",
    starCount: 15410,
    pullCount: "5.4B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Databases"],
    updatedAt: "2026-11-06T08:15:30Z",
  },
  {
    repoName: "node",
    shortDescription: "Node.js JavaScript runtime built on Chrome's V8 JavaScript engine for scalable network apps.",
    starCount: 14200,
    pullCount: "7.8B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Languages & Runtimes"],
    updatedAt: "2026-11-07T12:00:00Z",
  },
  {
    repoName: "python",
    shortDescription: "Python is an interpreted, interactive, object-oriented, open-source programming language.",
    starCount: 11950,
    pullCount: "6.2B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Languages & Runtimes"],
    updatedAt: "2026-11-06T19:30:10Z",
  },
  {
    repoName: "golang",
    shortDescription:
      "Go (golang) is an open source programming language that makes it easy to build simple, fast software.",
    starCount: 6540,
    pullCount: "3.1B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Languages & Runtimes"],
    updatedAt: "2026-11-05T16:10:00Z",
  },
  {
    repoName: "alpine",
    shortDescription:
      "A minimal Docker image based on Alpine Linux with a complete package index and only 5MB in size.",
    starCount: 11200,
    pullCount: "14.2B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Base OS", "Tools"],
    updatedAt: "2026-11-07T09:12:00Z",
  },
  {
    repoName: "caddy",
    shortDescription: "Caddy 2 is an enterprise-ready, open source web server with automatic HTTPS written in Go.",
    starCount: 2310,
    pullCount: "250M+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Web Servers", "Networking"],
    updatedAt: "2026-11-03T11:45:00Z",
  },
  {
    repoName: "traefik",
    shortDescription: "Traefik, the Cloud Native Edge Router & Reverse Proxy for microservices architectures.",
    starCount: 3950,
    pullCount: "820M+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Networking", "Web Servers"],
    updatedAt: "2026-11-02T15:20:00Z",
  },
  {
    repoName: "prom/prometheus",
    shortDescription: "The Prometheus monitoring system and time series database for cloud-native metrics telemetry.",
    starCount: 4890,
    pullCount: "1.2B+",
    isOfficial: false,
    publisher: "Prometheus Community",
    categories: ["Monitoring & Tools"],
    updatedAt: "2026-11-04T10:00:00Z",
  },
  {
    repoName: "grafana/grafana",
    shortDescription:
      "The open and composable observability and data visualization platform for metrics and dashboards.",
    starCount: 5240,
    pullCount: "1.8B+",
    isOfficial: false,
    publisher: "Grafana Labs",
    categories: ["Monitoring & Tools"],
    updatedAt: "2026-11-05T08:30:00Z",
  },
  {
    repoName: "rabbitmq",
    shortDescription:
      "RabbitMQ is one of the most popular open source message brokers supporting AMQP, MQTT and STOMP.",
    starCount: 5670,
    pullCount: "2.4B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Databases", "Networking"],
    updatedAt: "2026-11-06T14:15:00Z",
  },
  {
    repoName: "memcached",
    shortDescription: "High-performance, distributed memory object caching system for dynamic web applications.",
    starCount: 2150,
    pullCount: "1.6B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Caching", "Databases"],
    updatedAt: "2026-11-01T12:00:00Z",
  },
  {
    repoName: "busybox",
    shortDescription: "Busybox combines tiny versions of many common UNIX utilities into a single multi-call binary.",
    starCount: 3820,
    pullCount: "6.9B+",
    isOfficial: true,
    publisher: "Docker Official",
    categories: ["Base OS", "Tools"],
    updatedAt: "2026-11-05T04:20:00Z",
  },
];

const DOCKER_ACCOUNT_STORAGE_KEY = "k8s_docker_account";

export function getStoredDockerAccount(): DockerAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(DOCKER_ACCOUNT_STORAGE_KEY) ||
      window.localStorage.getItem(DOCKER_ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    const account = JSON.parse(raw) as DockerAccount;
    // Retrieve ephemeral token if present
    const cred = window.sessionStorage.getItem(`${DOCKER_ACCOUNT_STORAGE_KEY}_sec`);
    if (cred) {
      try {
        account.token = decodeURIComponent(atob(cred));
      } catch {
        // Ignore decode errors
      }
    }
    return account;
  } catch {
    return null;
  }
}

export function saveStoredDockerAccount(account: DockerAccount): void {
  if (typeof window === "undefined") return;
  try {
    // Separate non-sensitive metadata from sensitive tokens
    const publicProfile: DockerAccount = {
      username: account.username,
      isConnected: account.isConnected,
      registryUrl: account.registryUrl,
      connectedAt: account.connectedAt,
    };
    // Store non-sensitive profile in sessionStorage (with fallback)
    window.sessionStorage.setItem(DOCKER_ACCOUNT_STORAGE_KEY, JSON.stringify(publicProfile));
    window.localStorage.setItem(DOCKER_ACCOUNT_STORAGE_KEY, JSON.stringify(publicProfile));

    // Store credentials only in ephemeral sessionStorage with obfuscation
    if (account.token) {
      window.sessionStorage.setItem(`${DOCKER_ACCOUNT_STORAGE_KEY}_sec`, btoa(encodeURIComponent(account.token)));
    }
  } catch {
    // Ignore storage quota or security errors
  }
}

export function clearStoredDockerAccount(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DOCKER_ACCOUNT_STORAGE_KEY);
    window.sessionStorage.removeItem(`${DOCKER_ACCOUNT_STORAGE_KEY}_sec`);
    window.localStorage.removeItem(DOCKER_ACCOUNT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function formatPullCount(count: number | string): string {
  if (typeof count === "string") return count;
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B+`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M+`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K+`;
  }
  return String(count);
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function getDefaultPortForImage(image: string): number {
  const img = image.toLowerCase();
  if (img.includes("nginx") || img.includes("caddy") || img.includes("httpd") || img.includes("apache")) return 80;
  if (img.includes("redis")) return 6379;
  if (img.includes("postgres")) return 5432;
  if (img.includes("mysql") || img.includes("mariadb")) return 3306;
  if (img.includes("mongo")) return 27017;
  if (img.includes("traefik")) return 8080;
  if (img.includes("prometheus")) return 9090;
  if (img.includes("grafana")) return 3000;
  if (img.includes("rabbitmq")) return 5672;
  if (img.includes("memcached")) return 11211;
  if (img.includes("elasticsearch")) return 9200;
  if (img.includes("kafka")) return 9092;
  return 8080;
}
