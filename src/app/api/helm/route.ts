import { NextRequest, NextResponse } from "next/server"
import { k8sStore } from "@/lib/k8s-store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'releases'
    const namespace = searchParams.get('namespace') || undefined

    if (action === 'charts') {
      const charts = k8sStore.getHelmCharts()
      return NextResponse.json(charts)
    }

    const releases = k8sStore.getHelmReleases(namespace)
    return NextResponse.json(releases)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Helm data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, chartName, releaseName, namespace, revision } = body

    if (action === 'install') {
      const release = k8sStore.installHelmChart(chartName, releaseName, namespace)
      return NextResponse.json({ success: true, release })
    }

    if (action === 'rollback') {
      const success = k8sStore.rollbackHelmRelease(releaseName, namespace, revision)
      return NextResponse.json({ success, message: success ? 'Rollback successful' : 'Release not found' })
    }

    if (action === 'uninstall') {
      const success = k8sStore.uninstallHelmRelease(releaseName, namespace)
      return NextResponse.json({ success, message: success ? 'Release uninstalled' : 'Release not found' })
    }

    return NextResponse.json({ error: 'Unknown Helm action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Helm operation failed' },
      { status: 500 }
    )
  }
}
