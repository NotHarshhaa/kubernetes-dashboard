import type { Metadata } from "next";

import { PodsView } from "./_components/pods-view";

export const metadata: Metadata = {
  title: "Pods",
  description: "Inspect and manage pods across namespaces with logs, exec and YAML.",
};

export default function Page() {
  return <PodsView />;
}
