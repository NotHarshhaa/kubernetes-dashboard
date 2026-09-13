import * as k8s from '@kubernetes/client-node'

export interface ClusterContextInfo {
  name: string
  cluster: string
  user: string
  namespace?: string
  isCurrent: boolean
}

export function getKubeConfig(req?: Request): { kc: k8s.KubeConfig; isAvailable: boolean; currentContext: string; error?: string } {
  const kc = new k8s.KubeConfig()
  let isAvailable = false
  let errorMsg: string | undefined

  try {
    kc.loadFromDefault()
    isAvailable = true
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'No kubeconfig found'
  }

  // Check if context override is passed via request headers or cookies
  if (isAvailable && req) {
    try {
      const headerContext = req.headers.get('x-k8s-context')
      let cookieContext: string | undefined

      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const match = cookieHeader.match(/k8s-context=([^;]+)/)
        if (match) cookieContext = decodeURIComponent(match[1])
      }

      const targetContext = headerContext || cookieContext
      if (targetContext) {
        const contexts = kc.getContexts()
        const exists = contexts.some(c => c.name === targetContext)
        if (exists) {
          kc.setCurrentContext(targetContext)
        }
      }
    } catch {
      // Keep default context if extraction fails
    }
  }

  return {
    kc,
    isAvailable,
    currentContext: isAvailable ? (kc.getCurrentContext() || '') : '',
    error: errorMsg
  }
}

export function getAvailableContexts(): ClusterContextInfo[] {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const current = kc.getCurrentContext()
    const contexts = kc.getContexts()

    if (!contexts || contexts.length === 0) {
      return [
        {
          name: 'demo-cluster',
          cluster: 'local-demo-k8s',
          user: 'admin',
          namespace: 'default',
          isCurrent: true
        }
      ]
    }

    return contexts.map(c => ({
      name: c.name,
      cluster: c.cluster,
      user: c.user,
      namespace: c.namespace || 'default',
      isCurrent: c.name === current
    }))
  } catch {
    return [
      {
        name: 'demo-cluster',
        cluster: 'local-demo-k8s',
        user: 'admin',
        namespace: 'default',
        isCurrent: true
      },
      {
        name: 'staging-k8s',
        cluster: 'staging-cluster',
        user: 'devops',
        namespace: 'staging',
        isCurrent: false
      },
      {
        name: 'production-us-east',
        cluster: 'prod-eks-cluster',
        user: 'cluster-admin',
        namespace: 'production',
        isCurrent: false
      }
    ]
  }
}
