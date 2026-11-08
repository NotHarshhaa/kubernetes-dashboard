import type { Metadata } from "next";

import { NamespacesView } from "./_components/namespaces-view";

export const metadata: Metadata = {
  title: "Namespaces",
  description: "Namespace quotas, limits and labels.",
};

export default function Page() {
  return <NamespacesView />;
}
