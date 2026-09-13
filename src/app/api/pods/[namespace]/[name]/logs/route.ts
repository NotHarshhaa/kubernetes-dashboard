import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'
import { getKubeConfig } from '@/lib/k8s-client'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; name: string }> }
) {
  const { namespace, name } = await params
  const { searchParams } = new URL(request.url)
  const container = searchParams.get('container') || undefined
  const tailLinesParam = searchParams.get('tailLines')
  const tailLines = tailLinesParam ? parseInt(tailLinesParam, 10) : 250
  const timestamps = searchParams.get('timestamps') !== 'false'
  const follow = searchParams.get('follow') === 'true'

  const { kc, isAvailable } = getKubeConfig(request)

  if (DEMO_MODE || !isAvailable) {
    const logs = k8sStore.getPodLogs(name, namespace, container)
    return NextResponse.json({ logs, isLive: false })
  }

  try {
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const logRes = await coreApi.readNamespacedPodLog({
      name,
      namespace,
      container,
      tailLines,
      timestamps,
      follow: false // Serverless request handles tailing via poll or streaming
    })

    const logs = typeof logRes === 'string' ? logRes : String(logRes || '')
    return NextResponse.json({
      logs: logs || k8sStore.getPodLogs(name, namespace, container),
      isLive: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.warn(`Error fetching real pod logs for ${namespace}/${name}, using fallback:`, error)
    const logs = k8sStore.getPodLogs(name, namespace, container)
    return NextResponse.json({ logs, isLive: false, fallback: true })
  }
}
