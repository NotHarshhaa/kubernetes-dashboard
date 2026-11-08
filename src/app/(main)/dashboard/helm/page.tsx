import type { Metadata } from "next";

import { HelmView } from "./_components/helm-view";

export const metadata: Metadata = {
  title: "Helm Hub",
  description: "Manage Helm releases and install curated charts.",
};

export default function Page() {
  return <HelmView />;
}
