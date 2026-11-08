import type { Metadata } from "next";

import { StorageView } from "./_components/storage-view";

export const metadata: Metadata = {
  title: "Storage & PVs",
  description: "Persistent volumes, claims and storage classes.",
};

export default function Page() {
  return <StorageView />;
}
