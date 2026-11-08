import type { Metadata } from "next";

import { SecurityView } from "./_components/security-view";

export const metadata: Metadata = {
  title: "Security & CIS",
  description: "CIS benchmark scoring and security findings with remediations.",
};

export default function Page() {
  return <SecurityView />;
}
