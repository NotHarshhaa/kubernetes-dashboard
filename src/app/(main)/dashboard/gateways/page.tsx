import type { Metadata } from "next";

import { GatewaysView } from "./_components/gateways-view";

export const metadata: Metadata = {
  title: "Gateway API",
  description: "Gateways, listeners and HTTPRoute traffic rules.",
};

export default function Page() {
  return <GatewaysView />;
}
