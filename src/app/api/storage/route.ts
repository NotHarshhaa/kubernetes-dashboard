import { NextRequest, NextResponse } from "next/server"
import { k8sStore } from "@/lib/k8s-store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const namespace = searchParams.get('namespace') || undefined

    const persistentVolumes = k8sStore.getPersistentVolumes()
    const persistentVolumeClaims = k8sStore.getPersistentVolumeClaims(namespace)
    const storageClasses = k8sStore.getStorageClasses()

    return NextResponse.json({
      persistentVolumes,
      persistentVolumeClaims,
      storageClasses
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch storage data' },
      { status: 500 }
    )
  }
}
