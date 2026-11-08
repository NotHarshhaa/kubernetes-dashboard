import type { Metadata } from "next";

import { WorkloadsView } from "./_components/workloads-view";

export const metadata: Metadata = {
  title: "Workloads",
  description: "Deployments, StatefulSets, DaemonSets, Jobs and CronJobs in one view.",
};

export default function Page() {
  return <WorkloadsView />;
}
