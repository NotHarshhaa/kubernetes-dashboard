# Kubernetes Dashboard

![GitHub stars](https://img.shields.io/github/stars/NotHarshhaa/kubernetes-dashboard?style=social)
![GitHub forks](https://img.shields.io/github/forks/NotHarshhaa/kubernetes-dashboard?style=social)
![Docker Pulls](https://img.shields.io/docker/pulls/harshhaareddy/kubernetes-dashboard)
![Docker Stars](https://img.shields.io/docker/stars/harshhaareddy/kubernetes-dashboard)
![License](https://img.shields.io/badge/license-MIT-blue)

A modern, production-grade Kubernetes dashboard built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **shadcn/ui**. Monitor, inspect, and manage multi-cluster Kubernetes environments with an intuitive, high-performance interface.

---

## 🌟 Key Features

- **Multi-Cluster Context Switcher**: Seamlessly switch between KubeConfig contexts (minikube, EKS, GKE, AKS, Talos, local) from the top navigation bar with dynamic header state.
- **Real Metrics & Resource Monitoring**: Direct integration with Kubernetes Metrics Server (`metrics.k8s.io/v1beta1`) for real CPU/memory allocation, pod density tracking, and trend analysis.
- **Interactive xterm.js Web Terminal**: Full ANSI PTY terminal powered by `@xterm/xterm` with `@kubernetes/client-node` container `Exec` streaming, command history, auto-resizing, and quick diagnostic shortcuts.
- **Dynamic CRD Explorer**: Auto-discover, search, and inspect `apiextensions.k8s.io/v1` Custom Resource Definitions (Cert-Manager, Istio, Prometheus, Karpenter, Kyverno) with live YAML viewing.
- **Gateway API Dashboard**: First-class support for `gateway.networking.k8s.io` (`GatewayClass`, `Gateway`, `HTTPRoute`) including listener protocols, ports, and weighted backend canary routing.
- **Live Pod Log Streaming**: Real-time log inspection with configurable tail lines, container selectors, auto-refresh, and clipboard export.
- **Interactive Topology Map**: End-to-end visual dependency graph tracing traffic from Ingress/Gateway $\to$ Service $\to$ Deployment $\to$ Pod $\to$ Node.
- **Comprehensive Workload Management**: Inspect and manage Pods, Deployments, StatefulSets, DaemonSets, Jobs, and CronJobs with instant scaling, restart, and cordon/drain actions.
- **Security & CIS Audits**: Integrated cluster vulnerability assessments, RBAC visibility, and CIS compliance benchmarks.
- **Helm Hub**: Overview of deployed Helm releases, chart revisions, and quick rollback/uninstall management.
- **Dual-Mode Operation**: Connects directly to real Kubernetes clusters via your local KubeConfig, with a built-in interactive demo engine when no cluster is reachable.

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

### Option 3: Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

---

## 📄 Dashboard Pages & Routes

| Route | Description |
| :--- | :--- |
| **`/`** | Cluster Overview, health status, node resource gauges, and live event feed |
| **`/workloads`** | Workload control plane (Deployments, StatefulSets, DaemonSets, Jobs, CronJobs) |
| **`/pods`** | Pod management, container status, live logs dialog, and interactive exec |
| **`/deployments`** | Deployment replicas, rollout status, image tracking, and scale actions |
| **`/services`** | Service endpoints, port forwarding mapping, and Ingress routing rules |
| **`/gateways`** | Next-gen Gateway API management (`Gateway`, `HTTPRoute`, `GatewayClass`) |
| **`/crds`** | Dynamic Custom Resource Definitions explorer, API group filtering, and YAML export |
| **`/config`** | ConfigMaps and Secrets inspector with decoded value viewing |
| **`/storage`** | PersistentVolumes (PV), PersistentVolumeClaims (PVC), and StorageClasses |
| **`/helm`** | Helm release management, chart revisions, and application lifecycle |
| **`/nodes`** | Node health, conditions, capacity vs allocatable, cordon and drain controls |
| **`/namespaces`** | Namespace listing, resource quotas, and multi-tenant isolation |
| **`/topology`** | Interactive visual map of cluster traffic flow and resource relationships |
| **`/terminal`** | Standalone xterm.js container shell with ANSI terminal diagnostics |
| **`/security`** | Cluster security audit, CIS benchmark findings, and vulnerability scores |
| **`/monitoring`** | High-resolution CPU, memory, and network utilization charts |
| **`/settings`** | Cluster connection settings, appearance, and dashboard preferences |

---

## 📸 Gallery

Check out our [**Dashboard Gallery**](./GALLERY.md) to preview screenshots of the dashboard interface, topology map, and terminal!

---

## 📚 Modern Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Terminal**: [@xterm/xterm](https://xtermjs.org/) & [@xterm/addon-fit](https://www.npmjs.com/package/@xterm/addon-fit)
- **Charts & Graphs**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Kubernetes Client**: [@kubernetes/client-node](https://github.com/kubernetes-client/javascript) (v1.4.0)

---

## 🔒 Security & RBAC

- The dashboard authenticates using your active `~/.kube/config` context or in-cluster ServiceAccount token.
- Role-Based Access Control (RBAC) manifests are provided in [k8s/rbac.yaml](k8s/rbac.yaml).
- For production multi-tenant environments, mount a restricted ServiceAccount token to enforce cluster policies.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Verify code correctness:
   ```bash
   npm run type-check
   npm run lint
   ```
5. Push to the branch and open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
