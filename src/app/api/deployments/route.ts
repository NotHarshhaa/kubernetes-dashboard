import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') || undefined

  if (DEMO_MODE) {
    return NextResponse.json(k8sStore.getDeployments(namespace))
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const res = namespace && namespace !== 'all'
      ? await appsApi.listNamespacedDeployment({ namespace })
      : await appsApi.listDeploymentForAllNamespaces()

    const deployments = res.items.map((deployment: k8s.V1Deployment) => ({
      name: deployment.metadata?.name || '',
      namespace: deployment.metadata?.namespace || '',
      replicas: deployment.spec?.replicas || 0,
      readyReplicas: deployment.status?.readyReplicas || 0,
      availableReplicas: deployment.status?.availableReplicas || 0,
      unavailableReplicas: deployment.status?.unavailableReplicas || 0,
      age: deployment.metadata?.creationTimestamp ? new Date(deployment.metadata.creationTimestamp).toISOString() : 'Active',
      images: deployment.spec?.template?.spec?.containers?.map((c: k8s.V1Container) => c.image || '') || [],
      labels: deployment.metadata?.labels || {}
    }))

    return NextResponse.json(deployments)
  } catch (error) {
    console.error('Error fetching deployments from K8s, using store fallback:', error)
    return NextResponse.json(k8sStore.getDeployments(namespace))
  }
}
