import { NextRequest, NextResponse } from 'next/server'
import { k8sStore } from '@/lib/k8s-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const namespace = searchParams.get('namespace') || undefined

  if (type === 'secrets') {
    return NextResponse.json(k8sStore.getSecrets(namespace))
  }
  if (type === 'configmaps') {
    return NextResponse.json(k8sStore.getConfigMaps(namespace))
  }

  return NextResponse.json({
    configMaps: k8sStore.getConfigMaps(namespace),
    secrets: k8sStore.getSecrets(namespace)
  })
}
