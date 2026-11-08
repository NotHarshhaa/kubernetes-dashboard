import type { Metadata } from "next";

import { TopologyView } from "./_components/topology-view";

export const metadata: Metadata = {
  title: "Topology Map",
  description: "Live dependency graph from ingress to compute nodes.",
};

export default function Page() {
  return <TopologyView />;
}
