import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'
import { getKubeConfig } from '@/lib/k8s-client'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(request: NextRequest) {
  const { kc, isAvailable } = getKubeConfig(request)

  if (DEMO_MODE || !isAvailable) {
    return NextResponse.json(k8sStore.getNodes())
  }

  try {
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = await k8sApi.listNode()

    const nodes = res.items.map((node: k8s.V1Node) => {
      const isReady = node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
      const isCordoned = node.spec?.unschedulable === true
      const status = isCordoned ? 'SchedulingDisabled' : isReady ? 'Ready' : 'NotReady'

      return {
        name: node.metadata?.name || '',
        status,
        roles: Object.keys(node.metadata?.labels || {})
          .filter(label => label.startsWith('node-role.kubernetes.io/'))
          .map(label => label.replace('node-role.kubernetes.io/', '')) || ['worker'],
        version: node.status?.nodeInfo?.kubeletVersion || '',
        internalIP: node.status?.addresses?.find(a => a.type === 'InternalIP')?.address || '',
        externalIP: node.status?.addresses?.find(a => a.type === 'ExternalIP')?.address || '',
        osImage: node.status?.nodeInfo?.osImage || '',
        kernelVersion: node.status?.nodeInfo?.kernelVersion || '',
        containerRuntime: node.status?.nodeInfo?.containerRuntimeVersion || '',
        cpuCapacity: node.status?.capacity?.cpu || '',
        memoryCapacity: node.status?.capacity?.memory || '',
        podsCapacity: node.status?.capacity?.pods || '110',
        allocatableCPU: node.status?.allocatable?.cpu || '',
        allocatableMemory: node.status?.allocatable?.memory || ''
      }
    })

    return NextResponse.json(nodes)
  } catch (error) {
    console.error('Error fetching nodes from K8s, using store fallback:', error)
    return NextResponse.json(k8sStore.getNodes())
  }
}
