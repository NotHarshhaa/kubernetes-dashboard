# Security Policy

The Kubernetes Dashboard team takes the security of our application, container images, and user clusters seriously. This document outlines our security policies, supported versions, coordinated vulnerability disclosure process, and enterprise container hardening standards.

---

## 📋 Supported Versions

Security patches and vulnerability updates are actively backported to the following versions:

| Version | Supported | Minimum Node.js Engine | Container Profiles |
|---|:---:|---|---|
| `1.x.x` | :white_check_mark: Active | `>=20.0.0` (Recommended `22.x` LTS) | Alpine, Distroless, Chainguard, Debian |
| `< 1.0.0` | :x: Unsupported | Legacy | Deprecated |

---

## 🔒 Reporting a Vulnerability

If you discover a potential security vulnerability in Kubernetes Dashboard, **please do not disclose it publicly** via GitHub Issues, public pull requests, or discussion boards.

### Preferred Reporting Channels:
1. **GitHub Private Security Advisory**: Submit a confidential report via [GitHub Security Advisory](https://github.com/NotHarshhaa/kubernetes-dashboard/security/advisories/new).
2. **Direct Security Contact**: Email the maintainers directly with the subject tag `[SECURITY BUG]` to coordinate a fix.

### What to Include in Your Report:
To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential security impact.
- Affected components (specific API route, dashboard screen, or container base image).
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Relevant environment details (Kubernetes version, KubeConfig setup, container image tag/profile, OS/browser).
- Any proposed remediation or mitigation steps (if available).

### Response SLA:
- **Initial Acknowledgment**: Within **24–48 hours** of receiving the report.
- **Triage & Severity Assessment**: Within **3–5 business days**.
- **Fix & Disclosure Schedule**: Critical and High severity issues are prioritized for release within **7–14 calendar days**, followed by a public advisory and CVE publication.

---

## 🛡️ Enterprise Container & Supply Chain Security

Kubernetes Dashboard containers are built adhering to **CIS Docker Benchmark** and **NIST SP 800-190** standards:

### 1. Zero Critical/High CVE Policy
- Production images enforce automated dependency audits (`npm audit`) and vulnerability scans via **Trivy** and **Docker Scout**.
- Out-of-the-box base images are stripped of package managers (`apk`, `apt`), build CLI tools (`npm`, `npx`, `corepack`), and unnecessary binaries to minimize attack surface.

### 2. Specialized Container Profiles
Enterprises can deploy based on their organizational compliance model:
- **Hardened Alpine (`:latest`, `:alpine`)**: Default balanced profile. Package managers and npm runtime tools are stripped; runs as unprivileged user `nextjs` (UID 1001).
- **Google Distroless (`:distroless`)**: Maximum runtime containment. Eliminates `/bin/sh`, `/bin/bash`, and all shell utilities. Attackers gaining RCE cannot spawn shells or download payloads. Runs as `nonroot` (UID 65532).
- **Chainguard Wolfi (`:chainguard`)**: Zero-known CVE image with continuous daily rebuilds, cryptographic attestations, and full Software Bill of Materials (SBOM) for SOC 2, FedRAMP, and HIPAA compliance. Runs as `node` (UID 1000).
- **Debian Bookworm Slim (`:debian`)**: Full glibc compatibility for enterprise APM tracing agents (Datadog, Dynatrace, New Relic) and native C++ binaries.

### 3. Non-Root Execution
- Containers never run as root (`UID 0`).
- Pods are pre-configured with `runAsNonRoot: true` to prevent privilege escalation.

### 4. PID 1 Signal Forwarding
- Production containers integrate `dumb-init` as PID 1 to properly handle POSIX `SIGTERM` and `SIGINT` signals, ensuring clean termination during Kubernetes rolling updates.

---

## 🔐 Cluster & Runtime Security Safeguards

### 1. KubeConfig Credential Isolation
- The dashboard reads your local KubeConfig using `@kubernetes/client-node` (`loadFromDefault`).
- **Credentials and cluster certificates are never stored, cached on disk, or transmitted to any external third party.**
- In demo mode (`NEXT_PUBLIC_DEMO_MODE=true`), all cluster operations are intercepted by the in-memory demo engine and never touch real network infrastructure.

### 2. In-Cluster RBAC Least Privilege
- When deployed within a Kubernetes cluster, the dashboard communicates via the in-cluster ServiceAccount token.
- RBAC manifests in [`k8s/rbac.yaml`](./k8s/rbac.yaml) grant read-only or minimum necessary permissions across cluster resources.

### 3. Web Terminal (xterm.js) Execution Security
- Container `exec` streaming runs through the authenticated Kubernetes API server over secure WebSockets.
- Commands executed within the terminal are subject to the underlying Kubernetes RBAC permissions of the active KubeConfig or ServiceAccount.

---

## ☸️ Kubernetes Pod Security Standards (PSS Restricted)

When deploying to Kubernetes clusters enforcing the **Restricted** Pod Security Standard, apply the following `securityContext` from [`k8s/deployment.yaml`](./k8s/deployment.yaml):

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

## 🤖 Automated Security Scans

The repository runs automated security checks on every pull request and weekly via GitHub Actions:
- **Trivy Repository Scan**: Scans repository filesystem and dependencies for known CVEs and committed secrets.
- **Trivy Container Scan**: Builds and scans container images against the latest CVE databases.
- **Biome Lint & Type Check**: Enforces static code analysis, strict TypeScript typing, and safe imports.
