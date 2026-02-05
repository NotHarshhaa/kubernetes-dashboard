import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'

export async function GET() {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = await k8sApi.listNode()

    const nodes = res.items.map((node: k8s.V1Node) => ({
      name: node.metadata?.name || '',
      status: node.status?.conditions?.find((c: k8s.V1NodeCondition) => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
      roles: node.metadata?.labels?.['node-role.kubernetes.io/master'] ? ['master'] : 
             node.metadata?.labels?.['node-role.kubernetes.io/control-plane'] ? ['control-plane'] : ['worker'],
      version: node.status?.nodeInfo?.kubeletVersion || '',
      internalIP: node.status?.addresses?.find((addr: k8s.V1NodeAddress) => addr.type === 'InternalIP')?.address || '',
      externalIP: node.status?.addresses?.find((addr: k8s.V1NodeAddress) => addr.type === 'ExternalIP')?.address || '',
      osImage: node.status?.nodeInfo?.osImage || '',
      kernelVersion: node.status?.nodeInfo?.kernelVersion || '',
      containerRuntime: node.status?.nodeInfo?.containerRuntimeVersion || '',
      cpuCapacity: node.status?.capacity?.cpu || '',
      memoryCapacity: node.status?.capacity?.memory || '',
      podsCapacity: node.status?.capacity?.pods || '',
      allocatableCPU: node.status?.allocatable?.cpu || '',
      allocatableMemory: node.status?.allocatable?.memory || ''
    }))

    return NextResponse.json(nodes)
  } catch (error) {
    console.error('Error fetching nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nodes' },
      { status: 500 }
    )
  }
}
