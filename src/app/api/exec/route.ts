import { NextRequest, NextResponse } from "next/server"
import { PassThrough } from "stream"
import * as k8s from "@kubernetes/client-node"
import { k8sStore } from "@/lib/k8s-store"
import { getKubeConfig } from "@/lib/k8s-client"

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { podName, namespace, container, command } = body

    if (!podName || !namespace || !command) {
      return NextResponse.json({ error: 'podName, namespace, and command are required' }, { status: 400 })
    }

    const { kc, isAvailable } = getKubeConfig(request)

    // Attempt real Kubernetes Exec stream when available
    if (!DEMO_MODE && isAvailable) {
      try {
        const exec = new k8s.Exec(kc)
        const stdout = new PassThrough()
        const stderr = new PassThrough()
        let stdoutData = ''
        let stderrData = ''

        stdout.on('data', (chunk) => {
          stdoutData += chunk.toString()
        })
        stderr.on('data', (chunk) => {
          stderrData += chunk.toString()
        })

        const cmdArray = ['/bin/sh', '-c', command]
        let exitCode = 0

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve() // Return what we have after timeout
          }, 8000)

          exec.exec(
            namespace,
            podName,
            container || 'main',
            cmdArray,
            stdout,
            stderr,
            null,
            false,
            (status: k8s.V1Status) => {
              clearTimeout(timeout)
              if (status.status === 'Failure') {
                exitCode = 1
              }
              resolve()
            }
          ).catch((err) => {
            clearTimeout(timeout)
            reject(err)
          })
        })

        const output = stdoutData || stderrData
        if (output || exitCode !== 0) {
          return NextResponse.json({
            output: output || '(No output returned)',
            exitCode,
            isRealCluster: true
          })
        }
      } catch (clusterExecErr) {
        console.warn(`Real K8s Exec on pod ${podName} failed, using store fallback:`, clusterExecErr)
      }
    }

    // Fallback to simulated store exec
    const result = k8sStore.execCommand(podName, namespace, container || 'main', command)
    return NextResponse.json({
      ...result,
      isRealCluster: false
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Exec failed' },
      { status: 500 }
    )
  }
}
