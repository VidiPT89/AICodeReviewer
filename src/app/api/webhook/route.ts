import { NextResponse } from 'next/server'
import { reviewOpenedPull, webhooks } from '@/lib/github'
import { hasWebhookSecret } from '@/lib/keys'

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''
  const hooks = webhooks()

  if (hasWebhookSecret() && hooks) {
    try {
      await hooks.verify(payload, signature)
    } catch {
      return NextResponse.json({ error: 'bad signature' }, { status: 401 })
    }
  }

  const event = request.headers.get('x-github-event')
  if (event !== 'pull_request') {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const body = JSON.parse(payload) as {
    action?: string
    installation?: { id?: number }
    pull_request?: {
      number?: number
      title?: string
      user?: { login?: string }
    }
    repository?: { name?: string; owner?: { login?: string } }
  }

  if (body.action !== 'opened' && body.action !== 'synchronize' && body.action !== 'reopened') {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const owner = body.repository?.owner?.login
  const repo = body.repository?.name
  const number = body.pull_request?.number
  const installationId = body.installation?.id
  if (!owner || !repo || !number || !installationId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const review = await reviewOpenedPull({
    installationId,
    owner,
    repo,
    number,
    title: body.pull_request?.title ?? `PR #${number}`,
    author: body.pull_request?.user?.login ?? 'unknown',
  })

  return NextResponse.json({ ok: true, review })
}
