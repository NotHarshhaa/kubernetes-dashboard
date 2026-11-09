# Kubernetes Dashboard

![GitHub stars](https://img.shields.io/github/stars/NotHarshhaa/kubernetes-dashboard?style=social)
![GitHub forks](https://img.shields.io/github/forks/NotHarshhaa/kubernetes-dashboard?style=social)
![Docker Pulls](https://img.shields.io/docker/pulls/harshhaareddy/kubernetes-dashboard)
![License](https://img.shields.io/badge/license-MIT-blue)

> **An enterprise-ready, developer-first Kubernetes command center engineered for Platform Engineers, SREs, and DevOps teams.**
>
> Built on a modern Next.js 16 + shadcn/ui + Tailwind CSS v4 admin shell, this dashboard unifies multi-cluster fleet operations, **AI Error Diagnostics Copilot**, **FinOps & Cloud Cost Optimization**, **GitOps ArgoCD & Flux Hub**, real-time telemetry, AI/GPU accelerator observability, next-gen Gateway API routing, and browser-native ANSI container terminal execution.

---

## 🌟 Key Features

- **🤖 AI Error Diagnostics Copilot**: Built-in intelligent SRE incident diagnostic engine. Performs instant root cause analysis (RCA), workload impact assessments, and generates copyable `kubectl` remediation commands for crashing pods (`CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`, `ExitCode 137/127`). Supports **OpenAI**, **Google Gemini**, **Anthropic Claude**, and **Local LLMs (Ollama / vLLM)**, with an expert zero-key heuristics fallback engine.
- **💰 FinOps & Cost Optimizer**: Full cloud cost monitoring, namespace attribution, waste identification, and automated right-sizing. Supports **AWS (EKS)**, **Google Cloud (GKE)**, **Azure (AKS)**, and Bare-Metal pricing models with 1-click remediation actions and exportable FinOps audits.
- **🔄 GitOps ArgoCD & Flux Hub**: Unified continuous deployment command center for **ArgoCD** (`Application`, `ApplicationSet`) and **Flux v2** (`Kustomization`, `GitRepository`, `HelmRelease`). Features real-time sync status, health checks, target Git repo/branch tracking, live cluster drift diff inspection, and one-click manual reconcile.
- **Modern UI Shell**: shadcn/ui design system with 60+ primitives, dark/light themes, theme presets, layout controls, and a ⌘J command palette for instant navigation.
- **Multi-Cluster Context Switcher**: Seamlessly switch between KubeConfig contexts (minikube, EKS, GKE, AKS, Talos, local) from the header.
- **📊 Real-Time Monitoring & Telemetry**: Dedicated live monitoring screen (`/dashboard/monitoring`) tracking cluster saturation, node resource pressure, workload distribution, and active warning alerts.
- **AI Workloads & GPU Observability**: GPU fleet monitoring (models, VRAM, thermals, power draw) and real-time tracking of AI serving runtimes (**vLLM**, **Ollama**, **KubeRay**, **HuggingFace TGI**).
- **Workload Autoscaling (HPA)**: Dedicated autoscaling view with replica ranges, utilization vs. thresholds, and scaling conditions.
- **Interactive xterm.js Web Terminal**: Full ANSI PTY terminal powered by `@xterm/xterm` with `@kubernetes/client-node` container `Exec` streaming, command history, and quick diagnostic shortcuts.
- **Dynamic CRD Explorer**: Auto-discover, search, and inspect Custom Resource Definitions (Cert-Manager, Istio, Prometheus, Karpenter, Kyverno) with live YAML viewing.
- **Gateway API Dashboard**: First-class support for `gateway.networking.k8s.io` (`Gateway`, `HTTPRoute`) with listener protocols, ports, and backends.
- **Live Pod Log Streaming**: Real-time log inspection with container selectors, auto-refresh follow mode, filtering, one-click AI log diagnosis, and clipboard/download export.
- **Interactive Topology Map**: End-to-end visual dependency graph tracing traffic from Ingress → Service → Deployment → Pod → Node.
- **Comprehensive Workload Management**: Pods, Deployments, StatefulSets, DaemonSets, Jobs, and CronJobs with instant scale, restart, trigger, and delete actions.
- **Storage, Config & Secrets**: PersistentVolumes, claims, storage classes, ConfigMaps, and Secrets with YAML inspection.
- **Security & CIS Audits**: Cluster vulnerability assessments with category scoring and remediation guidance.
- **Helm Hub**: Deployed Helm releases, curated charts, quick install, rollback and uninstall.
- **Dual-Mode Operation**: Connects directly to real clusters via your local KubeConfig, with a built-in interactive demo engine (`NEXT_PUBLIC_DEMO_MODE=true`) when no cluster is reachable.

---

## 🤖 AI Error Diagnostics Copilot

The dashboard features an integrated **Site Reliability Engineering (SRE) AI Diagnostics Copilot** that automatically diagnoses unhealthy workloads, container crash loops, and failed deployment rollouts.

```
+-----------------------------------------------------------------------------------+
|  Sparkles AI Error Diagnostics Copilot                                            |
|  Target Pod: payment-service-5c4d6f789-qx7k2 • production • [CRITICAL]            |
+-----------------------------------------------------------------------------------+
|  Provider: Google Gemini (gemini-1.5-flash)                                       |
|                                                                                   |
|  Summary:                                                                         |
|  Container 'payment-gateway' was terminated by Linux OOM Killer (Exit Code 137). |
|                                                                                   |
|  Root Cause Analysis:                                                             |
|  The container exceeded its configured memory limit (resources.limits.memory).    |
|  The Linux kernel terminated process PID 14 to protect host stability.            |
|                                                                                   |
|  Recommended Action Plan:                                                         |
|  > Inspect Pod memory limits and increase resources.limits.memory in Deployment   |
|  > Profile heap allocations (Node.js --max-old-space-size or JVM -XX:MaxRAM)     |
|                                                                                   |
|  Remediation CLI Commands:                                                        |
|  $ kubectl set resources deployment -n production --limits=memory=1Gi [Copy]      |
|  $ kubectl describe pod payment-service-5c4d6f789-qx7k2 -n production [Terminal] |
+-----------------------------------------------------------------------------------+
```

### Supported Providers & Models

| Provider | Supported Models | Authentication | Endpoint |
|---|---|---|---|
| **OpenAI** | `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `o1-mini` | Bearer API Key | `https://api.openai.com/v1` |
| **Google Gemini** | `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash` | Gemini API Key | Google AI Studio REST API |
| **Anthropic Claude** | `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus` | `x-api-key` | `https://api.anthropic.com/v1` |
| **Local / Custom LLM** | `llama3`, `mistral`, `deepseek-r1`, `qwen2.5`, any custom | Optional API Key | `http://localhost:11434/v1` (Ollama/vLLM) |

### Setting Up Your API Key in Dashboard Settings

1. Navigate to **Dashboard Settings** (`/dashboard/settings`).
2. Locate the **AI Error Diagnostics Copilot** section.
3. Toggle the switch to **Enabled**.
4. Select your preferred **AI Provider** and **Model**.
5. Enter your **API Key** (masked with an eye toggle for security). Keys are saved securely in browser storage (`localStorage`) and never committed to version control.
6. If using **Ollama** or **vLLM**, select **Custom / Local** and configure your local endpoint (e.g. `http://localhost:11434/v1`).
7. Click **Test Connection** to immediately verify API connectivity.
8. Click **Save Changes**.

> [!TIP]
> **Zero-Key Out-of-the-Box Heuristics**: If you do not have an API key configured, the dashboard automatically routes diagnostic queries through its built-in expert Kubernetes heuristic engine. It instantly identifies `OOMKilled` (137), `ImagePullBackOff`, binary missing (`127`/`126`), permission errors, and network timeouts with exact `kubectl` remediation commands.

---

## 💰 FinOps & Cost Optimizer

Kubernetes Dashboard includes a complete **FinOps & Cloud Cost Optimization Suite** (`/dashboard/finops`) engineered to eradicate idle cluster spend, right-size overprovisioned workloads, and provide granular financial attribution.

```
+-------------------------------------------------------------------------------------------+
|  FinOps & Cost Optimizer                                                                  |
|  Pricing Profile: AWS (EKS / gp3) • Live Attribution                                      |
+-------------------------------------------------------------------------------------------+
|  [ Monthly Run Rate ]    [ Potential Savings ]    [ Idle / Wasted ]    [ Efficiency Score ]|
|      $4,342 / mo             -$1,055 / mo             $890 / mo             69% (Grade B)  |
|   ~$145/day (32 vCPU)      24.3% reducible         Over-requested RAM    Target: >80%     |
+-------------------------------------------------------------------------------------------+
```

### Core FinOps Capabilities

- **Multi-Cloud Pricing Profiles**: Switch seamlessly between **AWS EKS**, **Google Cloud GKE**, **Azure AKS**, or **Bare-Metal / Custom** pricing rates ($/vCPU-hr, $/GB-hr, $/Storage-GB, $/GPU-hr).
- **Automated Workload Right-Sizing**: Detects containers with excessive CPU/memory allocations compared to actual usage, providing 1-click `kubectl set resources` commands and immediate remediation.
- **Orphaned Storage Detection**: Identifies unattached PersistentVolumes and claims (e.g. orphaned gp3/pd-standard volumes) accumulating unnecessary monthly cloud charges.
- **Node Consolidation & Bin-Packing**: Spots underutilized worker nodes (<20% allocation) and provides safe `cordon` and `drain` workflows to downscale node groups.
- **Namespace Cost Attribution**: Granular percentage and monetary breakdown showing exact CPU, Memory, Storage, and GPU costs per namespace with efficiency scoring.
- **14-Day Trajectory Forecasting**: Compares current spending trajectories against optimized potential run rates.
- **FinOps Audit Export**: One-click JSON export for financial stakeholders, finance teams, and platform engineering audits.

---

## 🔄 GitOps ArgoCD & Flux Hub

Kubernetes Dashboard provides a multi-engine **GitOps Command Center** (`/dashboard/gitops`) unifying continuous deployment fleets managed by **ArgoCD** and **Flux v2**.

```
+-------------------------------------------------------------------------------------------+
|  GitOps ArgoCD & Flux Hub                                                                 |
|  Engines: [All Engines] [ArgoCD] [Flux v2]                                                |
+-------------------------------------------------------------------------------------------+
|  [ Managed Apps ]         [ Sync Status ]          [ Health Status ]      [ Cluster Drift ]|
|      6 apps                 4 / 6 Synced              4 Healthy           3 drifted fields|
|  4 Argo • 2 Flux          2 Out of Sync            1 Degraded              Live vs Git diff|
+-------------------------------------------------------------------------------------------+
```

### Core GitOps Capabilities

- **Unified Multi-Engine Support**: Seamlessly observes and manages **ArgoCD** (`Application`, `ApplicationSet`) alongside **Flux v2** (`Kustomization`, `GitRepository`, `HelmRelease`).
- **Live Configuration Drift Detection**: Instantly compares declared Git manifests against live Kubernetes API states. Detects out-of-band manual changes (e.g., manual replica scaling or memory adjustments).
- **Interactive Drift Diff Inspector**: Shows field-level side-by-side diffs between Git targets and live cluster resources.
- **One-Click Reconciliation**: Trigger immediate manual synchronizations (`argocd app sync` or `flux reconcile kustomization`) with live toast feedback.
- **Reconciliation Suspension**: Pause auto-sync or suspend reconciler loops for maintenance windows without editing Git repositories.
- **Git Commit & Audit Trail**: Full timeline of reconciled Git commit hashes, commit messages, authors, and execution statuses.

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

With `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` the dashboard runs against the built-in demo engine (sample cluster data, simulated exec, FinOps analytics, GitOps reconciliations, mock AI diagnostics), so you can explore every screen without a real cluster.

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized Next.js 16 production build |
| `npm run start` | Serve the production build |
| `npm run type-check` | TypeScript strict project check (`tsc --noEmit`) |
| `npm run lint` | Biome linter check |
| `npm run check` | Biome lint + format validation |
| `npm run check:fix` | Auto-fix Biome lint/format issues |
| `npm run docker:build` | Build default hardened Alpine container image |
| `npm run docker:build:distroless` | Build zero-shell Google Distroless container image |
| `npm run docker:build:chainguard` | Build zero-CVE Chainguard Wolfi container image |
| `npm run docker:build:debian` | Build glibc-compatible Debian Bookworm Slim image |
| `npm run docker:run` | Run the Docker container locally |
| `npm run k8s:deploy` / `k8s:delete` | Apply / remove in-cluster manifests |

---

## 🧱 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React Compiler), React 19
- **UI & Design**: shadcn/ui (radix-nova style), Tailwind CSS v4, Lucide React icons, Recharts visualizations
- **Diagnostics & GitOps**: AI Diagnostics Engine + FinOps Cost Attribution + ArgoCD/Flux Reconciler Hub
- **Kubernetes**: `@kubernetes/client-node` with automatic KubeConfig discovery and per-request context switching via cookies
- **Terminal**: `@xterm/xterm` + `@xterm/addon-fit`
- **Security**: Web Crypto SHA-256 password hashing, Least-Privilege container execution, 0-CVE container profiles
- **Toasts**: sonner
- **Tooling**: Biome (lint + format), Husky + lint-staged, GitHub Actions CI

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/                  # 30 Kubernetes API routes (pods, nodes, exec, helm, finops, gitops, ai/diagnose, ...)
│   │   ├── ai/diagnose/      # AI Error Diagnostics Copilot endpoint
│   │   ├── finops/           # FinOps cost attribution & optimization actions endpoint
│   │   └── gitops/           # GitOps ArgoCD & Flux reconciliation endpoint
│   ├── (main)/dashboard/     # Dashboard screens (overview, pods, nodes, terminal, monitoring, finops, gitops, ...)
│   │   ├── finops/           # FinOps & Cost Optimizer screen and attribution tabs
│   │   ├── gitops/           # GitOps ArgoCD & Flux Hub with drift inspector
│   │   ├── monitoring/       # Real-time telemetry and cluster saturation metrics
│   │   ├── pods/             # Pod fleet view with "Diagnose with AI" action
│   │   ├── settings/         # Dashboard & AI Copilot API Key configuration
│   │   └── _components/      # Shared shell: ai-diagnostics-dialog, pod-logs-dialog, sidebar, header
│   ├── layout.tsx            # Root layout with theme + preferences boot
│   └── page.tsx              # Redirects to /dashboard/overview
├── components/ui/            # shadcn/ui primitives (do not edit directly)
├── lib/                      # gitops, finops, ai-diagnostics, k8s-client, k8s-store (demo engine), api-client
├── navigation/sidebar/       # Sidebar navigation config
└── config/app-config.ts      # App name, repository, metadata
```

---

## 🛡️ Enterprise Container Security & Image Profiles

To meet strict enterprise security, compliance, and zero-trust requirements (CIS Docker Benchmark, NIST SP 800-190, SOC 2, FedRAMP, HIPAA), Kubernetes Dashboard provides **four specialized container profiles**. Organizations can select the profile that aligns with their security posture and runtime requirements.

### Profile Comparison Matrix

| Profile | Dockerfile | Base Image | Size | Shell (`/bin/sh`) | Package Manager | Security Controls & Best For |
|---|---|---|---|---|---|---|
| **Hardened Alpine** *(Default)* | `Dockerfile` | `node:22-alpine3.23` | ~88 MB | Yes | **Removed** | **Production Balanced.** OS packages upgraded, package manager (`/sbin/apk`) and build tools (`npm`, `npx`, `corepack`) completely stripped, non-root user (`nextjs:1001`), `dumb-init` signal handling. |
| **Google Distroless** | `Dockerfile.distroless` | `gcr.io/distroless/nodejs22-debian12` | ~76 MB | **None** | **None** | **Maximum Containment.** Zero shell and zero package managers. Attackers gaining RCE cannot spawn interactive shells or download payloads (`curl`/`wget` absent). Runs as `nonroot:65532`. |
| **Chainguard Wolfi** | `Dockerfile.chainguard` | `cgr.dev/chainguard/node:latest` | ~90 MB | Minimal | **None** | **Zero-CVE Target & Compliance.** Continuous daily rebuilds with upstream patches, signed attestations, and complete SBOM for FedRAMP, SOC 2 Type II, and PCI-DSS audits. Runs as `node:1000`. |
| **Debian Bookworm Slim** | `Dockerfile.debian` | `node:22-bookworm-slim` | ~104 MB | Yes | `apt` (cleaned) | **Enterprise APM & Glibc.** High compatibility for native C++ addons and enterprise monitoring/tracing sidecars (Datadog, Dynatrace, New Relic). Hardened with non-root user (`nextjs:1001`). |

---

### Security Controls Implemented Across All Profiles

1. **Non-Root Execution (Least Privilege)**:
   - Containers never run as `root` (UID 0).
   - Profiles enforce dedicated unprivileged system users: `nextjs` (UID 1001), `nonroot` (UID 65532), or `node` (UID 1000).
2. **Build Tool & Package Manager Stripping**:
   - `npm`, `npx`, `corepack`, and their 40+ bundled CLI dependencies are completely removed from production runtime images, eliminating attack surfaces.
   - Package manager binaries (`apk`, `apt-get`) and caches are wiped from the final runner stages.
3. **PID 1 Signal Handling & Zombie Reaping**:
   - Integrated with `dumb-init` to properly trap and forward POSIX signals (`SIGTERM`, `SIGINT`) for graceful pod shutdown during Kubernetes rolling deployments.
4. **Shell-Independent Native Healthchecks**:
   - Health probes execute via Node.js native `fetch()` without invoking an interactive shell or external binary dependencies.
5. **Next.js Standalone Multi-Stage Bundling**:
   - Only production server artifacts and tree-shaken dependencies from `.next/standalone` are copied into the image, keeping the footprint under 100 MB.

---

### Building & Running Profiles

```bash
# Option 1: Hardened Alpine (Default)
npm run docker:build
docker run -p 3000:3000 -v ~/.kube/config:/home/nextjs/.kube/config:ro kubernetes-dashboard:latest

# Option 2: Google Distroless (Zero Shell)
npm run docker:build:distroless
docker run -p 3000:3000 -v ~/.kube/config:/home/nonroot/.kube/config:ro kubernetes-dashboard:distroless

# Option 3: Chainguard Wolfi (Compliance & Zero-CVE)
npm run docker:build:chainguard
docker run -p 3000:3000 -v ~/.kube/config:/home/node/.kube/config:ro kubernetes-dashboard:chainguard

# Option 4: Debian Bookworm Slim (APM Compatible)
npm run docker:build:debian
docker run -p 3000:3000 -v ~/.kube/config:/home/nextjs/.kube/config:ro kubernetes-dashboard:debian
```

---

### Hardened Kubernetes SecurityContext (PSS Restricted)

For Kubernetes deployments enforcing the **Restricted Pod Security Standard**, apply the following `securityContext` in [`k8s/deployment.yaml`](./k8s/deployment.yaml):

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: kubernetes-dashboard
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

---

## 🔐 Security Notes

- The dashboard uses your **local KubeConfig** (`loadFromDefault`) — it never stores credentials.
- AI Copilot API keys are stored in client session storage and never sent to external servers except directly to the configured inference provider.
- In-cluster deployments read the ServiceAccount token with the RBAC rules in `k8s/rbac.yaml`.
- Demo mode never touches a real cluster.
- For our full vulnerability disclosure policy, container hardening controls, and compliance guidelines, see [SECURITY.md](./SECURITY.md).

## 📄 License

MIT — see [LICENSE](./LICENSE).
