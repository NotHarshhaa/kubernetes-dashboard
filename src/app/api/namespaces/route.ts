import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(k8sStore.getNamespaces())
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = await k8sApi.listNamespace()

    const namespaces = res.items.map((ns: k8s.V1Namespace) => ({
      name: ns.metadata?.name || '',
      status: ns.status?.phase || 'Active',
      age: ns.metadata?.creationTimestamp ? new Date(ns.metadata.creationTimestamp).toISOString() : 'Active',
      labels: ns.metadata?.labels || {},
      annotations: ns.metadata?.annotations || {},
      resourceQuotas: { pods: 'Unlimited', services: 'Unlimited' },
      limits: { cpu: 'Unlimited', memory: 'Unlimited' }
    }))

    return NextResponse.json(namespaces)
  } catch (error) {
    console.error('Error fetching namespaces from K8s, using store fallback:', error)
    return NextResponse.json(k8sStore.getNamespaces())
  }
}
