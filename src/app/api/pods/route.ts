import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') || undefined

  if (DEMO_MODE) {
    return NextResponse.json(k8sStore.getPods(namespace))
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = namespace && namespace !== 'all'
      ? await k8sApi.listNamespacedPod({ namespace })
      : await k8sApi.listPodForAllNamespaces()

    const pods = res.items.map((pod: k8s.V1Pod) => ({
      name: pod.metadata?.name || '',
      namespace: pod.metadata?.namespace || '',
      status: pod.status?.phase || 'Running',
      phase: pod.status?.phase || 'Running',
      node: pod.spec?.nodeName || '',
      ip: pod.status?.podIP || '',
      createdAt: pod.metadata?.creationTimestamp ? new Date(pod.metadata.creationTimestamp).toISOString() : 'Active',
      restarts: pod.status?.containerStatuses?.reduce((acc: number, container: k8s.V1ContainerStatus) => acc + (container.restartCount || 0), 0) || 0,
      ready: `${pod.status?.containerStatuses?.filter((c: k8s.V1ContainerStatus) => c.ready).length || 0}/${pod.status?.containerStatuses?.length || 0}`,
      containers: pod.spec?.containers?.map(c => ({
        name: c.name,
        image: c.image || '',
        ready: pod.status?.containerStatuses?.find(cs => cs.name === c.name)?.ready || false,
        restartCount: pod.status?.containerStatuses?.find(cs => cs.name === c.name)?.restartCount || 0
      })) || []
    }))

    return NextResponse.json(pods)
  } catch (error) {
    console.error('Error fetching pods from K8s, using store fallback:', error)
    return NextResponse.json(k8sStore.getPods(namespace))
  }
}
