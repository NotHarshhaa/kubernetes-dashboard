import type { Metadata } from "next";

import { AiWorkloadsView } from "./_components/ai-workloads-view";

export const metadata: Metadata = {
  title: "AI & GPU Workloads",
  description: "LLM inference, fine-tuning jobs and GPU fleet telemetry.",
};

export default function Page() {
  return <AiWorkloadsView />;
}
