import type { Metadata } from "next";

import { DeploymentsView } from "./_components/deployments-view";

export const metadata: Metadata = {
  title: "Deployments",
  description: "Manage deployment replicas, rolling restarts and GitOps sync status.",
};

export default function Page() {
  return <DeploymentsView />;
}
