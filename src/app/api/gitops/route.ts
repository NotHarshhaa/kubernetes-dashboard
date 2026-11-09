import { type NextRequest, NextResponse } from "next/server";

import { type GitOpsData, type GitOpsEngine, getGitOpsData, INITIAL_GITOPS_APPS } from "@/lib/gitops";

interface GitOpsActionBody {
  action: "sync" | "toggle-suspend";
  appId: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const engine = (searchParams.get("engine") || "all") as GitOpsEngine;
    const data: GitOpsData = getGitOpsData(engine);

    return NextResponse.json<GitOpsData>(data);
  } catch (err) {
    console.error("GitOps API GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve GitOps data", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GitOpsActionBody;
    const { action, appId } = body;

    if (!appId) {
      return NextResponse.json({ error: "appId is required" }, { status: 400 });
    }

    const app = INITIAL_GITOPS_APPS.find((a) => a.id === appId);
    if (!app) {
      return NextResponse.json({ error: `Application '${appId}' not found` }, { status: 404 });
    }

    if (action === "sync") {
      app.syncStatus = "Synced";
      app.healthStatus = "Healthy";
      app.lastSyncedAt = "Just now";
      app.drifts = [];

      return NextResponse.json({
        success: true,
        message: `${app.engine === "argocd" ? "ArgoCD Application" : "Flux Kustomization"} '${app.name}' synchronized successfully with revision '${app.targetRevision}'.`,
        app,
      });
    }

    if (action === "toggle-suspend") {
      app.syncPolicy = app.syncPolicy === "Suspended" ? "Automated (Prune + SelfHeal)" : "Suspended";
      app.healthStatus = app.syncPolicy === "Suspended" ? "Suspended" : "Healthy";

      return NextResponse.json({
        success: true,
        message: `Reconciliation for '${app.name}' is now ${app.syncPolicy === "Suspended" ? "SUSPENDED" : "RESUMED"}.`,
        app,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GitOps API POST error:", err);
    return NextResponse.json(
      { error: "Failed to process GitOps action", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
