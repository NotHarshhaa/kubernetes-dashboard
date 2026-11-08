# Kubernetes Dashboard

![GitHub stars](https://img.shields.io/github/stars/NotHarshhaa/kubernetes-dashboard?style=social)
![GitHub forks](https://img.shields.io/github/forks/NotHarshhaa/kubernetes-dashboard?style=social)
![Docker Pulls](https://img.shields.io/docker/pulls/harshhaareddy/kubernetes-dashboard)
![License](https://img.shields.io/badge/license-MIT-blue)

> **An enterprise-ready, developer-first Kubernetes command center engineered for Platform Engineers, SREs, and DevOps teams.**
>
> Built on a modern Next.js 16 + shadcn/ui + Tailwind CSS v4 admin shell, this dashboard unifies multi-cluster fleet operations, real-time telemetry, AI/GPU accelerator observability, GitOps workflow safeguards (ArgoCD & Flux), next-gen Gateway API routing, and browser-native ANSI container terminal execution.

---

## 🌟 Key Features

- **Modern UI Shell**: shadcn/ui design system with 60+ primitives, dark/light themes, theme presets, layout controls, and a ⌘J command palette for instant navigation.
- **Multi-Cluster Context Switcher**: Seamlessly switch between KubeConfig contexts (minikube, EKS, GKE, AKS, Talos, local) from the header.
- **AI Workloads & GPU Observability**: GPU fleet monitoring (models, VRAM, thermals, power draw) and real-time tracking of AI serving runtimes (**vLLM**, **Ollama**, **KubeRay**, **HuggingFace TGI**).
- **Workload Autoscaling (HPA)**: Dedicated autoscaling view with replica ranges, utilization vs. thresholds, and scaling conditions.
- **GitOps Awareness**: Automated detection of **ArgoCD** and **FluxCD** tags with sync status badges on deployments.
- **Interactive xterm.js Web Terminal**: Full ANSI PTY terminal powered by `@xterm/xterm` with `@kubernetes/client-node` container `Exec` streaming, command history, and quick diagnostic shortcuts.
- **Dynamic CRD Explorer**: Auto-discover, search, and inspect Custom Resource Definitions (Cert-Manager, Istio, Prometheus, Karpenter, Kyverno) with live YAML viewing.
- **Gateway API Dashboard**: First-class support for `gateway.networking.k8s.io` (`Gateway`, `HTTPRoute`) with listener protocols, ports, and backends.
- **Live Pod Log Streaming**: Real-time log inspection with container selectors, auto-refresh follow mode, filtering, and clipboard/download export.
- **Interactive Topology Map**: End-to-end visual dependency graph tracing traffic from Ingress → Service → Deployment → Pod → Node.
- **Comprehensive Workload Management**: Pods, Deployments, StatefulSets, DaemonSets, Jobs, and CronJobs with instant scale, restart, trigger, and delete actions.
- **Storage, Config & Secrets**: PersistentVolumes, claims, storage classes, ConfigMaps, and Secrets with YAML inspection.
- **Security & CIS Audits**: Cluster vulnerability assessments with category scoring and remediation guidance.
- **Helm Hub**: Deployed Helm releases, curated charts, quick install, rollback and uninstall.
- **Dual-Mode Operation**: Connects directly to real clusters via your local KubeConfig, with a built-in interactive demo engine (`NEXT_PUBLIC_DEMO_MODE=true`) when no cluster is reachable.

---

## 🐳 Docker Hub Quick Start

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-harshhaareddy%2Fkubernetes--dashboard-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/harshhaareddy/kubernetes-dashboard)

```bash
# Pull and run the dashboard container
docker run -p 3000:3000 -v ~/.kube/config:/root/.kube/config:ro harshhaareddy/kubernetes-dashboard:latest

# Access at http://localhost:3000
```

---

## 🚀 Deployment Options

### Option 1: Docker Compose
```bash
docker-compose up -d
```

### Option 2: Kubernetes Manifests
```bash
# Deploy to your Kubernetes cluster
kubectl apply -f k8s/

# Access via NodePort: http://<node-ip>:30007
```

---

## 🛠️ Local Development

```bash
# Install dependencies (npm)
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you are redirected to the Cluster Overview at `/dashboard/overview`.

With `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` the dashboard runs against the built-in demo engine (sample cluster data, simulated exec), so you can explore every screen without a cluster.

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run type-check` | TypeScript project check (`tsc --noEmit`) |
| `npm run lint` | Biome lint |
| `npm run check` | Biome lint + format check |
| `npm run check:fix` | Auto-fix lint/format issues |
| `npm run docker:build` / `docker:run` | Build / run the Docker image |
| `npm run k8s:deploy` / `k8s:delete` | Apply / remove in-cluster manifests |

---

## 🧱 Tech Stack

- **Framework**: Next.js 16 (App Router, React Compiler), React 19
- **UI**: shadcn/ui (radix-nova style), Tailwind CSS v4, lucide-react icons, recharts visualizations
- **Kubernetes**: `@kubernetes/client-node` with automatic KubeConfig discovery and per-request context switching via cookies
- **Terminal**: `@xterm/xterm` + `@xterm/addon-fit`
- **Toasts**: sonner
- **Tooling**: Biome (lint + format), Husky + lint-staged, GitHub Actions CI

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/                  # 27 Kubernetes API routes (pods, nodes, exec, helm, ...)
│   ├── (main)/dashboard/     # Dashboard screens (overview, pods, nodes, terminal, ...)
│   │   └── _components/      # Shared shell: sidebar, header, dialogs, charts
│   ├── layout.tsx            # Root layout with theme + preferences boot
│   └── page.tsx              # Redirects to /dashboard/overview
├── components/ui/            # shadcn/ui primitives (do not edit directly)
├── lib/                      # k8s-client, k8s-store (demo engine), api-client
├── navigation/sidebar/       # Sidebar navigation config
└── config/app-config.ts      # App name, repository, metadata
```

---

## 🔐 Security Notes

- The dashboard uses your **local KubeConfig** (`loadFromDefault`) — it never stores credentials.
- In-cluster deployments read the ServiceAccount token with the RBAC rules in `k8s/rbac.yaml`.
- Demo mode never touches a real cluster.

## 📄 License

MIT — see [LICENSE](./LICENSE).
