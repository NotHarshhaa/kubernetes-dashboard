import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const namespace = searchParams.get('namespace')

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const res = namespace
      ? await appsApi.listNamespacedDeployment({ namespace })
      : await appsApi.listDeploymentForAllNamespaces()

    const deployments = res.items.map((deployment: k8s.V1Deployment) => ({
      name: deployment.metadata?.name || '',
      namespace: deployment.metadata?.namespace || '',
      replicas: deployment.spec?.replicas || 0,
      readyReplicas: deployment.status?.readyReplicas || 0,
      availableReplicas: deployment.status?.availableReplicas || 0,
      unavailableReplicas: deployment.status?.unavailableReplicas || 0,
      age: deployment.metadata?.creationTimestamp || '',
      images: deployment.spec?.template?.spec?.containers?.map((c: k8s.V1Container) => c.image) || []
    }))

    return NextResponse.json(deployments)
  } catch (error) {
    console.error('Error fetching deployments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    )
  }
}
