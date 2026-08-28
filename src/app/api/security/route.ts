import { NextRequest, NextResponse } from "next/server"
import { k8sStore } from "@/lib/k8s-store"

export async function GET() {
  try {
    const report = k8sStore.getSecurityReport()
    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch security report' },
      { status: 500 }
    )
  }
}
