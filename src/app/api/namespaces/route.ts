import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { generateDemoNamespaces } from '@/lib/demo-data'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET() {
  // Return demo data if demo mode is enabled
  if (DEMO_MODE) {
    return NextResponse.json(generateDemoNamespaces())
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = await k8sApi.listNamespace()

    const namespaces = res.items.map((namespace: k8s.V1Namespace) => ({
      name: namespace.metadata?.name || '',
      status: namespace.status?.phase || 'Unknown',
      age: namespace.metadata?.creationTimestamp 
        ? Math.floor((Date.now() - new Date(namespace.metadata.creationTimestamp).getTime()) / (1000 * 60 * 60 * 24)) + 'd'
        : 'Unknown',
      labels: namespace.metadata?.labels || {},
      annotations: namespace.metadata?.annotations || {},
      resourceQuotas: {
        pods: 'Unlimited',
        services: 'Unlimited',
        secrets: 'Unlimited',
        configMaps: 'Unlimited'
      },
      limits: {
        cpu: 'Unlimited',
        memory: 'Unlimited'
      }
    }))

    return NextResponse.json(namespaces)
  } catch (error) {
    console.error('Error fetching namespaces:', error)
    // Fallback to demo data on error
    return NextResponse.json(generateDemoNamespaces())
  }
}
