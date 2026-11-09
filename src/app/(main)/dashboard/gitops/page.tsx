import type { Metadata } from "next";

import { GitOpsView } from "./_components/gitops-view";

export const metadata: Metadata = {
  title: "GitOps ArgoCD & Flux Hub | Kubernetes Dashboard",
  description:
    "Declarative continuous delivery, multi-source git synchronization, cluster drift detection, and automated reconciliation.",
};

export default function GitOpsPage() {
  return <GitOpsView />;
}
