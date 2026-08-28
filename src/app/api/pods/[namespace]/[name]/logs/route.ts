import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; name: string }> }
) {
  const { namespace, name } = await params
  const { searchParams } = new URL(request.url)
  const container = searchParams.get('container') || undefined

  if (DEMO_MODE) {
    const logs = k8sStore.getPodLogs(name, namespace, container)
    return NextResponse.json({ logs })
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const logRes = await coreApi.readNamespacedPodLog({
      name,
      namespace,
      container,
      tailLines: 200,
      timestamps: true
    })

    const logs = typeof logRes === 'string' ? logRes : String(logRes || '')
    return NextResponse.json({ logs: logs || k8sStore.getPodLogs(name, namespace, container) })
  } catch (error) {
    console.error(`Error fetching real pod logs for ${namespace}/${name}:`, error)
    // Fallback to contextual simulated logs
    const logs = k8sStore.getPodLogs(name, namespace, container)
    return NextResponse.json({ logs })
  }
}
