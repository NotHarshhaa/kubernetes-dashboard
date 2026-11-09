import type { Metadata } from "next";

import { FinOpsView } from "./_components/finops-view";

export const metadata: Metadata = {
  title: "FinOps & Cost Optimizer | Kubernetes Dashboard",
  description: "Cloud cost attribution, waste detection, right-sizing recommendations, and cluster efficiency scoring.",
};

export default function FinOpsPage() {
  return <FinOpsView />;
}
