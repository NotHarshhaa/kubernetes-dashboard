import type { Metadata } from "next";

import { OverviewDashboard } from "./_components/overview-dashboard";

export const metadata: Metadata = {
  title: "Cluster Overview",
  description: "Health, capacity and activity across the Kubernetes cluster.",
};

export default function Page() {
  return <OverviewDashboard />;
}
