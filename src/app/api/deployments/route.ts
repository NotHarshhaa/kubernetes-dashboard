import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { generateDemoDeployments } from '@/lib/demo-data'

const DEMO_MODE = process.env.DEMO_MODE === 'true'

export async function GET(request: Request) {
  // Return demo data if demo mode is enabled
  if (DEMO_MODE) {
    const { searchParams } = new URL(request.url)
    const namespace = searchParams.get('namespace')
    const demoDeployments = generateDemoDeployments()
    const filteredDeployments = namespace 
      ? demoDeployments.filter(deployment => deployment.namespace === namespace)
      : demoDeployments
    return NextResponse.json(filteredDeployments)
  }

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
    // Fallback to demo data if real cluster is not available
    if (!DEMO_MODE) {
      console.log('Falling back to demo data due to connection error')
      const { searchParams } = new URL(request.url)
      const namespace = searchParams.get('namespace')
      const demoDeployments = generateDemoDeployments()
      const filteredDeployments = namespace 
        ? demoDeployments.filter(deployment => deployment.namespace === namespace)
        : demoDeployments
      return NextResponse.json(filteredDeployments)
    }
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    )
  }
}
