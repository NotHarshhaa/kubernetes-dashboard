import { NextRequest, NextResponse } from 'next/server'
import { getAvailableContexts, getKubeConfig } from '@/lib/k8s-client'

export async function GET(request: NextRequest) {
  const { currentContext } = getKubeConfig(request)
  const contexts = getAvailableContexts()

  // Mark the currently active one
  const enriched = contexts.map(c => ({
    ...c,
    isCurrent: c.name === currentContext || (!currentContext && c.isCurrent)
  }))

  return NextResponse.json({
    currentContext: currentContext || enriched.find(c => c.isCurrent)?.name || 'demo-cluster',
    contexts: enriched
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context } = body

    if (!context) {
      return NextResponse.json({ error: 'Context name is required' }, { status: 400 })
    }

    const contexts = getAvailableContexts()
    const exists = contexts.some(c => c.name === context)

    const response = NextResponse.json({
      success: true,
      currentContext: context,
      message: `Active cluster context switched to ${context}`,
      isValidInKubeconfig: exists
    })

    // Set cookie so all subsequent browser fetch requests automatically include the context
    response.cookies.set('k8s-context', context, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to switch context' },
      { status: 500 }
    )
  }
}
