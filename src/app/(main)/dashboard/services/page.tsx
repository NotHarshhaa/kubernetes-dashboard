import type { Metadata } from "next";

import { ServicesView } from "./_components/services-view";

export const metadata: Metadata = {
  title: "Services & Ingress",
  description: "ClusterIP, LoadBalancer and ingress routing across namespaces.",
};

export default function Page() {
  return <ServicesView />;
}
