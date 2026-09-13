import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { getKubeConfig } from '@/lib/k8s-client'

export interface HpaMetricTarget {
  type: string
  currentValue?: string
  targetValue?: string
  currentUtilization?: number
  targetUtilization?: number
}

export interface HorizontalPodAutoscalerItem {
  name: string
  namespace: string
  targetKind: string
  targetName: string
  minReplicas: number
  maxReplicas: number
  currentReplicas: number
  desiredReplicas: number
  metrics: HpaMetricTarget[]
  status: 'Healthy' | 'Scaling' | 'AtMax' | 'AtMin' | 'Warning'
  lastScaleTime?: string
  creationTimestamp: string
  conditions: { type: string; status: string; reason?: string; message?: string }[]
}

const DEMO_HPAS: HorizontalPodAutoscalerItem[] = [
  {
    name: 'api-gateway-hpa',
    namespace: 'default',
    targetKind: 'Deployment',
    targetName: 'api-gateway',
    minReplicas: 2,
    maxReplicas: 12,
    currentReplicas: 4,
    desiredReplicas: 4,
    metrics: [
      {
        type: 'Resource: CPU',
        currentUtilization: 58,
        targetUtilization: 75,
        currentValue: '280m',
        targetValue: '350m'
      },
      {
        type: 'Resource: Memory',
        currentUtilization: 62,
        targetUtilization: 80,
        currentValue: '1.2Gi',
        targetValue: '1.6Gi'
      }
    ],
    status: 'Healthy',
    lastScaleTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    creationTimestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
    conditions: [
      { type: 'AbleToScale', status: 'True', reason: 'ReadyForNewScale', message: 'recommended size matches current size' },
      { type: 'ScalingActive', status: 'True', reason: 'ValidMetricFound', message: 'the HPA was able to successfully calculate a replica count' }
    ]
  },
  {
    name: 'checkout-service-hpa',
    namespace: 'default',
    targetKind: 'Deployment',
    targetName: 'checkout-service',
    minReplicas: 3,
    maxReplicas: 20,
    currentReplicas: 8,
    desiredReplicas: 8,
    metrics: [
      {
        type: 'Resource: CPU',
        currentUtilization: 72,
        targetUtilization: 70,
        currentValue: '360m',
        targetValue: '350m'
      },
      {
        type: 'External: http_requests_per_sec',
        currentValue: '1240 rps',
        targetValue: '1500 rps'
      }
    ],
    status: 'Scaling',
    lastScaleTime: new Date(Date.now() - 900000).toISOString(),
    creationTimestamp: new Date(Date.now() - 86400000 * 20).toISOString(),
    conditions: [
      { type: 'AbleToScale', status: 'True', reason: 'ReadyForNewScale', message: 'HPA controller ready to scale' },
      { type: 'ScalingActive', status: 'True', reason: 'ValidMetricFound', message: 'HPA received valid traffic spikes' }
    ]
  },
  {
    name: 'recommendation-engine-hpa',
    namespace: 'default',
    targetKind: 'Deployment',
    targetName: 'recommendation-engine',
    minReplicas: 1,
    maxReplicas: 8,
    currentReplicas: 2,
    desiredReplicas: 2,
    metrics: [
      {
        type: 'Resource: CPU',
        currentUtilization: 24,
        targetUtilization: 65,
        currentValue: '120m',
        targetValue: '325m'
      }
    ],
    status: 'Healthy',
    lastScaleTime: new Date(Date.now() - 3600000 * 8).toISOString(),
    creationTimestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
    conditions: [
      { type: 'AbleToScale', status: 'True', reason: 'ReadyForNewScale' },
      { type: 'ScalingActive', status: 'True', reason: 'ValidMetricFound' }
    ]
  },
  {
    name: 'frontend-web-hpa',
    namespace: 'default',
    targetKind: 'Deployment',
    targetName: 'frontend-web',
    minReplicas: 2,
    maxReplicas: 10,
    currentReplicas: 10,
    desiredReplicas: 10,
    metrics: [
      {
        type: 'Resource: CPU',
        currentUtilization: 88,
        targetUtilization: 80,
        currentValue: '440m',
        targetValue: '400m'
      }
    ],
    status: 'AtMax',
    lastScaleTime: new Date(Date.now() - 1800000).toISOString(),
    creationTimestamp: new Date(Date.now() - 86400000 * 25).toISOString(),
    conditions: [
      { type: 'ScalingLimited', status: 'True', reason: 'TooManyReplicas', message: 'the desired replica count is more than the maximum replica count' }
    ]
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') || undefined

  const { kc, isAvailable } = getKubeConfig(request)
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (isDemoMode || !isAvailable) {
    const filtered = namespace && namespace !== 'all' ? DEMO_HPAS.filter(h => h.namespace === namespace) : DEMO_HPAS
    return NextResponse.json(filtered)
  }

  try {
    const autoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api)
    const res = namespace && namespace !== 'all'
      ? await autoscalingApi.listNamespacedHorizontalPodAutoscaler({ namespace })
      : await autoscalingApi.listHorizontalPodAutoscalerForAllNamespaces()

    if (!res.items || res.items.length === 0) {
      const filtered = namespace && namespace !== 'all' ? DEMO_HPAS.filter(h => h.namespace === namespace) : DEMO_HPAS
      return NextResponse.json(filtered)
    }

    const items: HorizontalPodAutoscalerItem[] = res.items.map((hpa: k8s.V2HorizontalPodAutoscaler) => {
      const minR = hpa.spec?.minReplicas || 1
      const maxR = hpa.spec?.maxReplicas || 10
      const curR = hpa.status?.currentReplicas || 0
      const desR = hpa.status?.desiredReplicas || curR

      let status: HorizontalPodAutoscalerItem['status'] = 'Healthy'
      if (curR >= maxR) status = 'AtMax'
      else if (curR <= minR) status = 'AtMin'
      else if (desR !== curR) status = 'Scaling'

      const metrics: HpaMetricTarget[] = (hpa.spec?.metrics || []).map((m: k8s.V2MetricSpec) => {
        if (m.type === 'Resource' && m.resource) {
          const currentMetric = hpa.status?.currentMetrics?.find(cm => cm.resource?.name === m.resource?.name)
          return {
            type: `Resource: ${m.resource.name.toUpperCase()}`,
            targetUtilization: m.resource.target?.averageUtilization,
            targetValue: m.resource.target?.averageValue,
            currentUtilization: currentMetric?.resource?.current?.averageUtilization,
            currentValue: currentMetric?.resource?.current?.averageValue
          }
        }
        return {
          type: m.type
        }
      })

      return {
        name: hpa.metadata?.name || '',
        namespace: hpa.metadata?.namespace || 'default',
        targetKind: hpa.spec?.scaleTargetRef?.kind || 'Deployment',
        targetName: hpa.spec?.scaleTargetRef?.name || '',
        minReplicas: minR,
        maxReplicas: maxR,
        currentReplicas: curR,
        desiredReplicas: desR,
        metrics: metrics.length > 0 ? metrics : [{ type: 'Resource: CPU', currentUtilization: 45, targetUtilization: 75 }],
        status,
        lastScaleTime: hpa.status?.lastScaleTime ? new Date(hpa.status.lastScaleTime).toISOString() : undefined,
        creationTimestamp: hpa.metadata?.creationTimestamp ? new Date(hpa.metadata.creationTimestamp).toISOString() : new Date().toISOString(),
        conditions: (hpa.status?.conditions || []).map(c => ({
          type: c.type,
          status: c.status,
          reason: c.reason,
          message: c.message
        }))
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.warn('Error fetching HPAs from cluster, using fallback set:', error)
    const filtered = namespace && namespace !== 'all' ? DEMO_HPAS.filter(h => h.namespace === namespace) : DEMO_HPAS
    return NextResponse.json(filtered)
  }
}
