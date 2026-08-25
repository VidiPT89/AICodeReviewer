import type { Score } from './types'

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function overallScore(parts: Omit<Score, 'overall'>): Score {
  const readability = clampScore(parts.readability)
  const performance = clampScore(parts.performance)
  const security = clampScore(parts.security)
  return {
    readability,
    performance,
    security,
    overall: clampScore((readability + performance + security) / 3),
  }
}
