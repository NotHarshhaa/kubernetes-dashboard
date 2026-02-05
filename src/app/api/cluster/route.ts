import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'

export async function GET() {
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
    return NextResponse.json(
      { error: 'Failed to fetch cluster info' },
      { status: 500 }
    )
  }
}
