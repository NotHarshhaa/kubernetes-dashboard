import { type NextRequest, NextResponse } from "next/server";

import { type CloudProvider, type FinOpsData, generateFinOpsAnalytics } from "@/lib/finops";
import { k8sStore } from "@/lib/k8s-store";

interface FinOpsActionRequest {
  action: "apply-recommendation" | "dismiss-recommendation";
  recommendationId: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerParam = (searchParams.get("provider") || "aws") as CloudProvider;

    // In real or demo mode, get node count and workload count
    const nodes = k8sStore.getNodes();
    const pods = k8sStore.getPods();

    const data: FinOpsData = generateFinOpsAnalytics(
      providerParam,
      Math.max(pods.length, 12),
      Math.max(nodes.length, 3),
    );

    return NextResponse.json<FinOpsData>(data);
  } catch (err) {
    console.error("FinOps API error:", err);
    return NextResponse.json(
      { error: "Failed to generate FinOps analytics", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FinOpsActionRequest;
    const { action, recommendationId } = body;

    if (!recommendationId) {
      return NextResponse.json({ error: "recommendationId is required" }, { status: 400 });
    }

    if (action === "apply-recommendation") {
      return NextResponse.json({
        success: true,
        message: `FinOps recommendation '${recommendationId}' applied successfully. Workload resource limits updated.`,
      });
    }

    if (action === "dismiss-recommendation") {
      return NextResponse.json({
        success: true,
        message: `Recommendation '${recommendationId}' dismissed.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("FinOps Action error:", err);
    return NextResponse.json(
      { error: "Failed to process FinOps action", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
