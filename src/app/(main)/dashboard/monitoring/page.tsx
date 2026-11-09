import type { Metadata } from "next";

import { MonitoringView } from "./_components/monitoring-view";

export const metadata: Metadata = {
  title: "Cluster Monitoring",
  description: "Real-time cluster telemetry, node capacity, and workload resource consumption.",
};

export default function Page() {
  return <MonitoringView />;
}
