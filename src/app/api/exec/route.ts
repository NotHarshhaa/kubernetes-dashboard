import { NextRequest, NextResponse } from "next/server"
import { k8sStore } from "@/lib/k8s-store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { podName, namespace, container, command } = body

    if (!podName || !namespace || !command) {
      return NextResponse.json({ error: 'podName, namespace, and command are required' }, { status: 400 })
    }

    const result = k8sStore.execCommand(podName, namespace, container || 'main', command)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Exec failed' },
      { status: 500 }
    )
  }
}
