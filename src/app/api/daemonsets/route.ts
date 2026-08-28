import { NextRequest, NextResponse } from 'next/server'
import { k8sStore } from '@/lib/k8s-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') || undefined
  const data = k8sStore.getDaemonSets(namespace)
  return NextResponse.json(data)
}
