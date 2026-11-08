import type { Metadata } from "next";

import { CrdsView } from "./_components/crds-view";

export const metadata: Metadata = {
  title: "Custom Resources",
  description: "Custom Resource Definitions extending the Kubernetes API.",
};

export default function Page() {
  return <CrdsView />;
}
