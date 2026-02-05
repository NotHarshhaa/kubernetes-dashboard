import { NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const namespace = searchParams.get('namespace')

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const res = namespace
      ? await k8sApi.listNamespacedService({ namespace })
      : await k8sApi.listServiceForAllNamespaces()

    const services = res.items.map((service: k8s.V1Service) => ({
      name: service.metadata?.name || '',
      namespace: service.metadata?.namespace || '',
      type: service.spec?.type || '',
      clusterIP: service.spec?.clusterIP || '',
      externalIPs: service.spec?.externalIPs || [],
      ports: service.spec?.ports?.map((port: k8s.V1ServicePort) => `${port.port}/${port.protocol}`).join(', ') || '',
      age: service.metadata?.creationTimestamp || ''
    }))

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
