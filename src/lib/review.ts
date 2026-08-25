import { parseUnifiedDiff } from './parse-diff'
import { overallScore } from './score'
import type { Axis, InlineNote, ReviewRecord } from './types'

type Rule = {
  axis: Axis
  test: (text: string) => boolean
  body: string
  suggestion: string
  cost: number
}

const RULES: Rule[] = [
  {
    axis: 'security',
    test: (text) => /\beval\s*\(/.test(text) || /\bnew Function\s*\(/.test(text),
    body: 'Dynamic code execution can run untrusted input.',
    suggestion: 'Parse data with JSON.parse or a schema. Never eval a string from a request.',
    cost: 28,
  },
  {
    axis: 'security',
    test: (text) => /\.innerHTML\s*=/.test(text) || /dangerouslySetInnerHTML/.test(text),
    body: 'HTML injection on this line can open XSS.',
    suggestion: 'Use textContent or a sanitised renderer instead of innerHTML.',
    cost: 24,
  },
  {
    axis: 'security',
    test: (text) => /password\s*=\s*['"][^'"]+['"]/i.test(text),
    body: 'A secret is hard-coded in the diff.',
    suggestion: 'Read secrets from the environment, never from source.',
    cost: 30,
  },
  {
    axis: 'performance',
    test: (text) => /\.map\s*\(\s*async/.test(text),
    body: 'Async work inside map can fire sequential round-trips.',
    suggestion: 'Collect promises and await them together.',
    cost: 16,
  },
  {
    axis: 'performance',
    test: (text) => /await\s+fetch/.test(text),
    body: 'Fetch inside the loop of a list can grow with every id.',
    suggestion: 'Batch the request or use Promise.all on a prepared list.',
    cost: 16,
  },
  {
    axis: 'readability',
    test: (text) => /:\s*any\b/.test(text) || /as any\b/.test(text),
    body: 'any hides the contract of this change.',
    suggestion: 'Name the type or infer it from a schema.',
    cost: 10,
  },
]

export function reviewDiff(prId: string, diff: string): ReviewRecord {
  const lines = parseUnifiedDiff(diff).filter((line) => line.kind === 'add')
  const notes: InlineNote[] = []
  let readability = 92
  let performance = 92
  let security = 94

  for (const line of lines) {
    for (const rule of RULES) {
      if (!rule.test(line.text)) continue
      notes.push({
        path: line.path,
        line: line.line,
        axis: rule.axis,
        body: rule.body,
        suggestion: rule.suggestion,
      })
      if (rule.axis === 'security') security -= rule.cost
      if (rule.axis === 'performance') performance -= rule.cost
      if (rule.axis === 'readability') readability -= rule.cost
    }
  }

  const score = overallScore({ readability, performance, security })
  const summary =
    notes.length === 0
      ? 'No blocking notes on the added lines. Keep the same bar on the next hunk.'
      : `${notes.length} note${notes.length === 1 ? '' : 's'} on added lines. Fix security first, then performance, then names.`

  return {
    prId,
    score,
    summary,
    notes,
    engine: 'local',
    at: new Date().toISOString(),
  }
}
