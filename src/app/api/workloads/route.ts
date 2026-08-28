import { NextRequest, NextResponse } from 'next/server'
import * as k8s from '@kubernetes/client-node'
import { k8sStore } from '@/lib/k8s-store'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') || undefined

  if (DEMO_MODE) {
    const deployments = k8sStore.getDeployments(namespace)
    const statefulSets = k8sStore.getStatefulSets(namespace)
    const daemonSets = k8sStore.getDaemonSets(namespace)
    const jobs = k8sStore.getJobs(namespace)
    const cronJobs = k8sStore.getCronJobs(namespace)
    const pods = k8sStore.getPods(namespace)

    const totalWorkloads = deployments.length + statefulSets.length + daemonSets.length + jobs.length + cronJobs.length
    const healthyWorkloads = deployments.filter(d => d.readyReplicas === d.replicas).length +
      statefulSets.filter(s => s.readyReplicas === s.replicas).length +
      daemonSets.filter(d => d.numberReady === d.desiredNumberScheduled).length +
      jobs.filter(j => j.status === 'Complete').length +
      cronJobs.filter(c => !c.suspend).length

    return NextResponse.json({
      deployments,
      statefulSets,
      daemonSets,
      jobs,
      cronJobs,
      pods,
      summary: {
        totalWorkloads,
        healthyWorkloads,
        warningWorkloads: totalWorkloads - healthyWorkloads,
        totalPods: pods.length,
        runningPods: pods.filter(p => p.status === 'Running').length
      }
    })
  }

  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)
    const batchApi = kc.makeApiClient(k8s.BatchV1Api)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const [depsRes, ssRes, dsRes, jobsRes, cronJobsRes, podsRes] = await Promise.allSettled([
      namespace ? appsApi.listNamespacedDeployment({ namespace }) : appsApi.listDeploymentForAllNamespaces(),
      namespace ? appsApi.listNamespacedStatefulSet({ namespace }) : appsApi.listStatefulSetForAllNamespaces(),
      namespace ? appsApi.listNamespacedDaemonSet({ namespace }) : appsApi.listDaemonSetForAllNamespaces(),
      namespace ? batchApi.listNamespacedJob({ namespace }) : batchApi.listJobForAllNamespaces(),
      namespace ? batchApi.listNamespacedCronJob({ namespace }) : batchApi.listCronJobForAllNamespaces(),
      namespace ? coreApi.listNamespacedPod({ namespace }) : coreApi.listPodForAllNamespaces()
    ])

    const deployments = depsRes.status === 'fulfilled' ? depsRes.value.items.map(d => ({
      name: d.metadata?.name || '',
      namespace: d.metadata?.namespace || '',
      replicas: d.spec?.replicas || 0,
      readyReplicas: d.status?.readyReplicas || 0,
      availableReplicas: d.status?.availableReplicas || 0,
      unavailableReplicas: d.status?.unavailableReplicas || 0,
      age: d.metadata?.creationTimestamp ? new Date(d.metadata.creationTimestamp).toISOString() : 'Active',
      images: d.spec?.template?.spec?.containers?.map(c => c.image || '') || [],
      labels: d.metadata?.labels || {}
    })) : k8sStore.getDeployments(namespace)

    const statefulSets = ssRes.status === 'fulfilled' ? ssRes.value.items.map(s => ({
      name: s.metadata?.name || '',
      namespace: s.metadata?.namespace || '',
      replicas: s.spec?.replicas || 0,
      readyReplicas: s.status?.readyReplicas || 0,
      currentReplicas: s.status?.currentReplicas || 0,
      age: s.metadata?.creationTimestamp ? new Date(s.metadata.creationTimestamp).toISOString() : 'Active',
      images: s.spec?.template?.spec?.containers?.map(c => c.image || '') || [],
      serviceName: s.spec?.serviceName || '',
      labels: s.metadata?.labels || {}
    })) : k8sStore.getStatefulSets(namespace)

    const daemonSets = dsRes.status === 'fulfilled' ? dsRes.value.items.map(d => ({
      name: d.metadata?.name || '',
      namespace: d.metadata?.namespace || '',
      desiredNumberScheduled: d.status?.desiredNumberScheduled || 0,
      currentNumberScheduled: d.status?.currentNumberScheduled || 0,
      numberReady: d.status?.numberReady || 0,
      numberAvailable: d.status?.numberAvailable || 0,
      age: d.metadata?.creationTimestamp ? new Date(d.metadata.creationTimestamp).toISOString() : 'Active',
      images: d.spec?.template?.spec?.containers?.map(c => c.image || '') || [],
      labels: d.metadata?.labels || {}
    })) : k8sStore.getDaemonSets(namespace)

    const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.items.map(j => ({
      name: j.metadata?.name || '',
      namespace: j.metadata?.namespace || '',
      completions: j.spec?.completions || 1,
      succeeded: j.status?.succeeded || 0,
      failed: j.status?.failed || 0,
      active: j.status?.active || 0,
      startTime: j.status?.startTime ? new Date(j.status.startTime).toISOString() : new Date().toISOString(),
      completionTime: j.status?.completionTime ? new Date(j.status.completionTime).toISOString() : undefined,
      status: (j.status?.succeeded && j.status.succeeded > 0 ? 'Complete' : j.status?.failed && j.status.failed > 0 ? 'Failed' : 'Running') as any,
      images: j.spec?.template?.spec?.containers?.map(c => c.image || '') || [],
      labels: j.metadata?.labels || {}
    })) : k8sStore.getJobs(namespace)

    const cronJobs = cronJobsRes.status === 'fulfilled' ? cronJobsRes.value.items.map(c => ({
      name: c.metadata?.name || '',
      namespace: c.metadata?.namespace || '',
      schedule: c.spec?.schedule || '* * * * *',
      suspend: c.spec?.suspend || false,
      activeJobs: c.status?.active?.length || 0,
      lastScheduleTime: c.status?.lastScheduleTime ? new Date(c.status.lastScheduleTime).toISOString() : undefined,
      lastSuccessfulTime: c.status?.lastSuccessfulTime ? new Date(c.status.lastSuccessfulTime).toISOString() : undefined,
      images: c.spec?.jobTemplate?.spec?.template?.spec?.containers?.map(ct => ct.image || '') || [],
      age: c.metadata?.creationTimestamp ? new Date(c.metadata.creationTimestamp).toISOString() : 'Active',
      labels: c.metadata?.labels || {}
    })) : k8sStore.getCronJobs(namespace)

    const pods = podsRes.status === 'fulfilled' ? podsRes.value.items.map(p => ({
      name: p.metadata?.name || '',
      namespace: p.metadata?.namespace || '',
      status: (p.status?.phase || 'Running') as any,
      phase: p.status?.phase || 'Running',
      node: p.spec?.nodeName || 'unknown',
      ip: p.status?.podIP || '10.244.0.1',
      createdAt: p.metadata?.creationTimestamp ? new Date(p.metadata.creationTimestamp).toISOString() : 'Active',
      restarts: p.status?.containerStatuses?.reduce((acc, c) => acc + (c.restartCount || 0), 0) || 0,
      ready: `${p.status?.containerStatuses?.filter(c => c.ready).length || 0}/${p.status?.containerStatuses?.length || 0}`,
      containers: p.spec?.containers?.map(c => ({
        name: c.name,
        image: c.image || '',
        ready: p.status?.containerStatuses?.find(cs => cs.name === c.name)?.ready || false,
        restartCount: p.status?.containerStatuses?.find(cs => cs.name === c.name)?.restartCount || 0
      })) || [],
      labels: p.metadata?.labels || {}
    })) : k8sStore.getPods(namespace)

    const totalWorkloads = deployments.length + statefulSets.length + daemonSets.length + jobs.length + cronJobs.length
    const healthyWorkloads = deployments.filter(d => d.readyReplicas === d.replicas).length +
      statefulSets.filter(s => s.readyReplicas === s.replicas).length +
      daemonSets.filter(d => d.numberReady === d.desiredNumberScheduled).length +
      jobs.filter(j => j.status === 'Complete').length +
      cronJobs.filter(c => !c.suspend).length

    return NextResponse.json({
      deployments,
      statefulSets,
      daemonSets,
      jobs,
      cronJobs,
      pods,
      summary: {
        totalWorkloads,
        healthyWorkloads,
        warningWorkloads: totalWorkloads - healthyWorkloads,
        totalPods: pods.length,
        runningPods: pods.filter(p => p.status === 'Running').length
      }
    })
  } catch (error) {
    console.error('Workloads fetch failed, using store fallback:', error)
    const deployments = k8sStore.getDeployments(namespace)
    const statefulSets = k8sStore.getStatefulSets(namespace)
    const daemonSets = k8sStore.getDaemonSets(namespace)
    const jobs = k8sStore.getJobs(namespace)
    const cronJobs = k8sStore.getCronJobs(namespace)
    const pods = k8sStore.getPods(namespace)

    return NextResponse.json({
      deployments,
      statefulSets,
      daemonSets,
      jobs,
      cronJobs,
      pods,
      summary: {
        totalWorkloads: deployments.length + statefulSets.length + daemonSets.length + jobs.length + cronJobs.length,
        healthyWorkloads: deployments.length + statefulSets.length + daemonSets.length,
        warningWorkloads: 0,
        totalPods: pods.length,
        runningPods: pods.length
      }
    })
  }
}
