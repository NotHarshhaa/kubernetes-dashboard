import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { generateDemoPods } from '@/lib/demo-data'

const DEMO_MODE = process.env.DEMO_MODE === 'true'

export async function GET(request: Request) {
  // Return demo data if demo mode is enabled
  if (DEMO_MODE) {
    const { searchParams } = new URL(request.url)
    const namespace = searchParams.get('namespace')
    const demoPods = generateDemoPods()
    const filteredPods = namespace 
      ? demoPods.filter(pod => pod.namespace === namespace)
      : demoPods
    return NextResponse.json(filteredPods)
  }

  try {
    const { searchParams } = new URL(request.url)
    const namespace = searchParams.get('namespace')

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = namespace
      ? await k8sApi.listNamespacedPod({ namespace })
      : await k8sApi.listPodForAllNamespaces()

    const pods = res.items.map((pod: k8s.V1Pod) => ({
      name: pod.metadata?.name || '',
      namespace: pod.metadata?.namespace || '',
      status: pod.status?.phase || '',
      phase: pod.status?.phase || '',
      node: pod.spec?.nodeName || '',
      ip: pod.status?.podIP || '',
      createdAt: pod.metadata?.creationTimestamp || '',
      restarts: pod.status?.containerStatuses?.reduce((acc: number, container: k8s.V1ContainerStatus) => acc + (container.restartCount || 0), 0) || 0,
      ready: `${pod.status?.containerStatuses?.filter((c: k8s.V1ContainerStatus) => c.ready).length || 0}/${pod.status?.containerStatuses?.length || 0}`
    }))

    return NextResponse.json(pods)
  } catch (error) {
    console.error('Error fetching pods:', error)
    // Fallback to demo data if real cluster is not available
    if (!DEMO_MODE) {
      console.log('Falling back to demo data due to connection error')
      const { searchParams } = new URL(request.url)
      const namespace = searchParams.get('namespace')
      const demoPods = generateDemoPods()
      const filteredPods = namespace 
        ? demoPods.filter(pod => pod.namespace === namespace)
        : demoPods
      return NextResponse.json(filteredPods)
    }
    return NextResponse.json(
      { error: 'Failed to fetch pods' },
      { status: 500 }
    )
  }
}
