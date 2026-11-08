import type { Metadata } from "next";

import { SettingsView } from "./_components/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Dashboard preferences and cluster connection details.",
};

export default function Page() {
  return <SettingsView />;
}
