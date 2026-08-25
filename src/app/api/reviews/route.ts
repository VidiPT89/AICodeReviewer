import { NextResponse } from 'next/server'
import { hasGitHubApp, hasHostedModel } from '@/lib/keys'
import { reviewDiff } from '@/lib/review'
import { getPull, listPulls, listReviews, saveReview } from '@/lib/store'

export async function GET() {
  return NextResponse.json({
    githubApp: hasGitHubApp(),
    hostedModel: hasHostedModel(),
    pulls: listPulls(),
    reviews: listReviews(),
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { prId?: string }
  const pull = body.prId ? getPull(body.prId) : undefined
  if (!pull) return NextResponse.json({ error: 'unknown pull' }, { status: 404 })

  const review = reviewDiff(pull.id, pull.diff)
  saveReview(review)
  return NextResponse.json(review)
}
