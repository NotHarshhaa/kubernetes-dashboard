import type { Metadata } from "next";

import { RegistryView } from "./_components/registry-view";

export const metadata: Metadata = {
  title: "Image Registry & Docker Hub | Kubernetes Dashboard",
  description: "Explore container images on Docker Hub and deploy workloads directly to your Kubernetes cluster.",
};

export default function RegistryPage() {
  return <RegistryView />;
}
