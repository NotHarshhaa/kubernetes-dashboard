import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'
import { getKubeConfig } from '@/lib/k8s-client'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(request: NextRequest) {
  const { kc, isAvailable, currentContext } = getKubeConfig(request)

  if (DEMO_MODE || !isAvailable) {
    const info = k8sStore.getClusterInfo()
    if (currentContext) {
      info.name = currentContext
    }
    return NextResponse.json(info)
  }

  try {
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)
    const versionApi = kc.makeApiClient(k8s.VersionApi)

    const [versionRes, nodesRes, podsRes, svcRes, nsRes] = await Promise.allSettled([
      versionApi.getCode(),
      coreApi.listNode(),
      coreApi.listPodForAllNamespaces(),
      coreApi.listServiceForAllNamespaces(),
      coreApi.listNamespace()
    ])

    const nodesCount = nodesRes.status === 'fulfilled' ? nodesRes.value.items.length : k8sStore.getNodes().length
    const podsCount = podsRes.status === 'fulfilled' ? podsRes.value.items.length : k8sStore.getPods().length
    const servicesCount = svcRes.status === 'fulfilled' ? svcRes.value.items.length : k8sStore.getServices().length
    const namespacesCount = nsRes.status === 'fulfilled' ? nsRes.value.items.length : k8sStore.getNamespaces().length
    const version = versionRes.status === 'fulfilled' ? `v${versionRes.value.major}.${versionRes.value.minor}` : 'v1.28.2'
    const clusterName = kc.getCurrentCluster()?.name || 'production-cluster'

    return NextResponse.json({
      name: clusterName,
      version,
      nodes: nodesCount,
      pods: podsCount,
      services: servicesCount,
      namespaces: namespacesCount,
      cpuUsage: 45.2,
      memoryUsage: 58.1
    })
  } catch (error) {
    console.error('Error fetching cluster info from K8s, using store fallback:', error)
    return NextResponse.json(k8sStore.getClusterInfo())
  }
}
