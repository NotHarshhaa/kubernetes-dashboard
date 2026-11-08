import type { Metadata } from "next";

import { NodesView } from "./_components/nodes-view";

export const metadata: Metadata = {
  title: "Nodes",
  description: "Node health, capacity, cordon and drain operations.",
};

export default function Page() {
  return <NodesView />;
}
