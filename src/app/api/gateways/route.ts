import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { getKubeConfig } from '@/lib/k8s-client'
import { GatewayItem, HTTPRouteItem } from '@/lib/api-client'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

const DEMO_GATEWAYS: GatewayItem[] = [
  {
    name: 'prod-edge-gateway',
    namespace: 'gateway-system',
    gatewayClassName: 'cilium-gateway',
    listeners: [
      { name: 'http', port: 80, protocol: 'HTTP', routesCount: 3 },
      { name: 'https', port: 443, protocol: 'HTTPS', routesCount: 5 }
    ],
    addresses: ['198.51.100.24', 'edge.internal.corp'],
    status: 'Programmed',
    creationTimestamp: new Date(Date.now() - 86400000 * 14).toISOString()
  },
  {
    name: 'internal-mesh-gateway',
    namespace: 'default',
    gatewayClassName: 'envoy-internal',
    listeners: [
      { name: 'grpc-service', port: 9090, protocol: 'GRPC', routesCount: 4 },
      { name: 'metrics-port', port: 9100, protocol: 'HTTP', routesCount: 2 }
    ],
    addresses: ['10.96.120.4'],
    status: 'Programmed',
    creationTimestamp: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    name: 'staging-gateway',
    namespace: 'staging',
    gatewayClassName: 'cilium-gateway',
    listeners: [
      { name: 'http-stg', port: 8080, protocol: 'HTTP', routesCount: 2 }
    ],
    addresses: ['198.51.100.25'],
    status: 'Accepted',
    creationTimestamp: new Date(Date.now() - 86400000 * 3).toISOString()
  }
]

const DEMO_ROUTES: HTTPRouteItem[] = [
  {
    name: 'frontend-route',
    namespace: 'default',
    hostnames: ['app.kubernetes.local', '*.corp.local'],
    parentGateways: ['prod-edge-gateway'],
    rules: [
      {
        matches: [{ path: { type: 'PathPrefix', value: '/' } }],
        backendRefs: [{ name: 'frontend-service', port: 80, weight: 90 }, { name: 'frontend-canary', port: 80, weight: 10 }]
      }
    ],
    status: 'Accepted',
    creationTimestamp: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    name: 'api-core-route',
    namespace: 'default',
    hostnames: ['api.kubernetes.local'],
    parentGateways: ['prod-edge-gateway', 'internal-mesh-gateway'],
    rules: [
      {
        matches: [{ path: { type: 'PathPrefix', value: '/v1' } }],
        backendRefs: [{ name: 'api-service', port: 8080, weight: 100 }]
      },
      {
        matches: [{ path: { type: 'PathPrefix', value: '/auth' } }],
        backendRefs: [{ name: 'auth-service', port: 4000, weight: 100 }]
      }
    ],
    status: 'Accepted',
    creationTimestamp: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    name: 'staging-catchall-route',
    namespace: 'staging',
    hostnames: ['staging.kubernetes.local'],
    parentGateways: ['staging-gateway'],
    rules: [
      {
        matches: [{ path: { type: 'PathPrefix', value: '/' } }],
        backendRefs: [{ name: 'staging-app-service', port: 8080, weight: 100 }]
      }
    ],
    status: 'Accepted',
    creationTimestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'gateways'
  const namespace = searchParams.get('namespace') || undefined

  const { kc, isAvailable } = getKubeConfig(request)

  if (DEMO_MODE || !isAvailable) {
    if (type === 'routes') {
      const filtered = namespace && namespace !== 'all' ? DEMO_ROUTES.filter(r => r.namespace === namespace) : DEMO_ROUTES
      return NextResponse.json(filtered)
    }
    const filtered = namespace && namespace !== 'all' ? DEMO_GATEWAYS.filter(g => g.namespace === namespace) : DEMO_GATEWAYS
    return NextResponse.json(filtered)
  }

  try {
    const customApi = kc.makeApiClient(k8s.CustomObjectsApi)

    if (type === 'routes') {
      const res: any = namespace && namespace !== 'all'
        ? await customApi.listNamespacedCustomObject({
            group: 'gateway.networking.k8s.io',
            version: 'v1',
            namespace,
            plural: 'httproutes'
          })
        : await customApi.listClusterCustomObject({
            group: 'gateway.networking.k8s.io',
            version: 'v1',
            plural: 'httproutes'
          })

      const items: HTTPRouteItem[] = (res.items || []).map((r: any) => ({
        name: r.metadata?.name || '',
        namespace: r.metadata?.namespace || 'default',
        hostnames: r.spec?.hostnames || [],
        parentGateways: r.spec?.parentRefs?.map((p: any) => p.name) || [],
        rules: r.spec?.rules || [],
        status: r.status?.parents?.some((p: any) => p.conditions?.some((c: any) => c.type === 'Accepted' && c.status === 'True')) ? 'Accepted' : 'Pending',
        creationTimestamp: r.metadata?.creationTimestamp ? new Date(r.metadata.creationTimestamp).toISOString() : new Date().toISOString()
      }))

      if (items.length === 0) {
        return NextResponse.json(namespace && namespace !== 'all' ? DEMO_ROUTES.filter(r => r.namespace === namespace) : DEMO_ROUTES)
      }
      return NextResponse.json(items)
    }

    // Default: gateways
    const res: any = namespace && namespace !== 'all'
      ? await customApi.listNamespacedCustomObject({
          group: 'gateway.networking.k8s.io',
          version: 'v1',
          namespace,
          plural: 'gateways'
        })
      : await customApi.listClusterCustomObject({
          group: 'gateway.networking.k8s.io',
          version: 'v1',
          plural: 'gateways'
        })

    const items: GatewayItem[] = (res.items || []).map((g: any) => ({
      name: g.metadata?.name || '',
      namespace: g.metadata?.namespace || 'default',
      gatewayClassName: g.spec?.gatewayClassName || '',
      listeners: (g.spec?.listeners || []).map((l: any) => ({
        name: l.name || '',
        port: l.port || 80,
        protocol: l.protocol || 'HTTP',
        routesCount: l.allowedRoutes?.namespaces?.from ? 1 : 0
      })),
      addresses: g.status?.addresses?.map((a: any) => a.value) || [],
      status: g.status?.conditions?.some((c: any) => c.type === 'Programmed' && c.status === 'True') ? 'Programmed' : 'Accepted',
      creationTimestamp: g.metadata?.creationTimestamp ? new Date(g.metadata.creationTimestamp).toISOString() : new Date().toISOString()
    }))

    if (items.length === 0) {
      return NextResponse.json(namespace && namespace !== 'all' ? DEMO_GATEWAYS.filter(g => g.namespace === namespace) : DEMO_GATEWAYS)
    }
    return NextResponse.json(items)
  } catch (err) {
    console.warn('Gateway API not installed or accessible in cluster, using modern mock set:', err)
    if (type === 'routes') {
      return NextResponse.json(namespace && namespace !== 'all' ? DEMO_ROUTES.filter(r => r.namespace === namespace) : DEMO_ROUTES)
    }
    return NextResponse.json(namespace && namespace !== 'all' ? DEMO_GATEWAYS.filter(g => g.namespace === namespace) : DEMO_GATEWAYS)
  }
}
