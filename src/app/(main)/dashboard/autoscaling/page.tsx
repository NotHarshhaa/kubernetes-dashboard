import type { Metadata } from "next";

import { AutoscalingView } from "./_components/autoscaling-view";

export const metadata: Metadata = {
  title: "Autoscaling (HPA)",
  description: "Horizontal Pod Autoscaler replica ranges and metrics.",
};

export default function Page() {
  return <AutoscalingView />;
}
