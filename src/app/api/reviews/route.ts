import { NextResponse } from 'next/server'
import { countHunk } from '@/lib/diff-stats'
import { hasGitHubApp, hasHostedModel } from '@/lib/keys'
import { reviewDiff } from '@/lib/review'
import { getPull, listPulls, listReviews, rememberPull, saveReview } from '@/lib/store'
import type { LocaleCode } from '@/lib/types'

function localeOf(value: unknown): LocaleCode {
  return value === 'pt' ? 'pt' : 'en'
}

export async function GET() {
  return NextResponse.json({
    githubApp: hasGitHubApp(),
    hostedModel: hasHostedModel(),
    pulls: listPulls(),
    reviews: listReviews(),
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { prId?: string; diff?: string; title?: string; locale?: string }
  const locale = localeOf(body.locale)

  if (body.diff?.includes('+++')) {
    const id = `paste-${Date.now()}`
    const diff = body.diff
    const pull = {
      id,
      number: 9000 + Math.floor(Math.random() * 99),
      title: body.title?.trim() || 'Pasted diff',
      repo: 'local/paste',
      author: 'you',
      opened: new Date().toISOString(),
      diff,
      ...countHunk(diff),
    }
    rememberPull(pull)
    const review = reviewDiff(id, diff, locale)
    saveReview(review)
    return NextResponse.json({ pull, review })
  }

  const pull = body.prId ? getPull(body.prId) : undefined
  if (!pull) return NextResponse.json({ error: 'unknown pull' }, { status: 404 })

  const review = reviewDiff(pull.id, pull.diff, locale)
  saveReview(review)
  return NextResponse.json({ pull, review })
}
