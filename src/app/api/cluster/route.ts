import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { generateDemoClusterInfo } from '@/lib/demo-data'

const DEMO_MODE = process.env.DEMO_MODE === 'true'

export async function GET() {
  // Return demo data if demo mode is enabled
  if (DEMO_MODE) {
    return NextResponse.json(generateDemoClusterInfo())
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const [nodes, pods, services, namespaces] = await Promise.all([
      k8sApi.listNode(),
      k8sApi.listPodForAllNamespaces(),
      k8sApi.listServiceForAllNamespaces(),
      k8sApi.listNamespace()
    ])

    const clusterInfo = {
      name: 'default-cluster',
      version: 'v1.28.0',
      nodes: nodes.items.length,
      pods: pods.items.length,
      services: services.items.length,
      namespaces: namespaces.items.length
    }

    return NextResponse.json(clusterInfo)
  } catch (error) {
    console.error('Error fetching cluster info:', error)
    // Fallback to demo data if real cluster is not available
    if (!DEMO_MODE) {
      console.log('Falling back to demo data due to connection error')
      return NextResponse.json(generateDemoClusterInfo())
    }
    return NextResponse.json(
      { error: 'Failed to fetch cluster info' },
      { status: 500 }
    )
  }
}
