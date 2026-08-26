import type { Score, Verdict } from './types'

export function verdictFor(score: Score): Verdict {
  if (score.security < 55 || score.overall < 50) return 'block'
  if (score.overall < 80) return 'caution'
  return 'ship'
}
