import { DEMO_PULLS } from './demo-prs'
import type { PullCard, ReviewRecord } from './types'

const reviews = new Map<string, ReviewRecord>()
const extraPulls: PullCard[] = []

export function listPulls(): PullCard[] {
  const seen = new Map<string, PullCard>()
  for (const pull of [...DEMO_PULLS, ...extraPulls]) seen.set(pull.id, pull)
  return [...seen.values()].sort((a, b) => b.number - a.number)
}

export function getPull(id: string): PullCard | undefined {
  return listPulls().find((pull) => pull.id === id)
}

export function rememberPull(pull: PullCard) {
  extraPulls.push(pull)
}

export function saveReview(review: ReviewRecord) {
  reviews.set(review.prId, review)
}

export function listReviews(): Record<string, ReviewRecord> {
  return Object.fromEntries(reviews.entries())
}

