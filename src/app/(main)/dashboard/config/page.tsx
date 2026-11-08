import type { Metadata } from "next";

import { ConfigView } from "./_components/config-view";

export const metadata: Metadata = {
  title: "Config & Secrets",
  description: "ConfigMaps and Secrets mounted by workloads.",
};

export default function Page() {
  return <ConfigView />;
}
