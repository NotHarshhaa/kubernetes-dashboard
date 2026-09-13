import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'
import { getKubeConfig } from '@/lib/k8s-client'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') || undefined
  const { kc, isAvailable } = getKubeConfig(request)

  if (DEMO_MODE || !isAvailable) {
    return NextResponse.json(k8sStore.getDeployments(namespace))
  }

  try {
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const res = namespace && namespace !== 'all'
      ? await appsApi.listNamespacedDeployment({ namespace })
      : await appsApi.listDeploymentForAllNamespaces()

    const deployments = res.items.map((deployment: k8s.V1Deployment) => {
      const labels = deployment.metadata?.labels || {}
      let gitops: { manager: 'argocd' | 'flux'; applicationName: string; syncStatus: 'Synced' | 'OutOfSync' | 'Reconciling' } | undefined = undefined

      if (labels['argocd.argoproj.io/instance'] || labels['app.kubernetes.io/instance']) {
        gitops = {
          manager: 'argocd',
          applicationName: labels['argocd.argoproj.io/instance'] || labels['app.kubernetes.io/instance'],
          syncStatus: 'Synced'
        }
      } else if (labels['kustomize.toolkit.fluxcd.io/name'] || labels['helm.toolkit.fluxcd.io/name']) {
        gitops = {
          manager: 'flux',
          applicationName: labels['kustomize.toolkit.fluxcd.io/name'] || labels['helm.toolkit.fluxcd.io/name'],
          syncStatus: 'Synced'
        }
      }

      return {
        name: deployment.metadata?.name || '',
        namespace: deployment.metadata?.namespace || '',
        replicas: deployment.spec?.replicas || 0,
        readyReplicas: deployment.status?.readyReplicas || 0,
        availableReplicas: deployment.status?.availableReplicas || 0,
        unavailableReplicas: deployment.status?.unavailableReplicas || 0,
        age: deployment.metadata?.creationTimestamp ? new Date(deployment.metadata.creationTimestamp).toISOString() : 'Active',
        images: deployment.spec?.template?.spec?.containers?.map((c: k8s.V1Container) => c.image || '') || [],
        labels,
        gitops
      }
    })

    return NextResponse.json(deployments)
  } catch (error) {
    console.error('Error fetching deployments from K8s, using store fallback:', error)
    return NextResponse.json(k8sStore.getDeployments(namespace))
  }
}
