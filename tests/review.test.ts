import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEMO_PULLS } from '../src/lib/demo-prs'
import { countHunk } from '../src/lib/diff-stats'
import { parseTheme } from '../src/lib/theme'
import { parseUnifiedDiff } from '../src/lib/parse-diff'
import { reviewMarkdown } from '../src/lib/report'
import { reviewDiff } from '../src/lib/review'
import { overallScore } from '../src/lib/score'
import { verdictFor } from '../src/lib/verdict'

describe('theme', () => {
  it('defaults to dark', () => {
    assert.equal(parseTheme(null), 'dark')
    assert.equal(parseTheme('light'), 'light')
  })
})

describe('diff parser', () => {
  it('keeps added line numbers from the hunk header', () => {
    const lines = parseUnifiedDiff(DEMO_PULLS[0].diff)
    const added = lines.filter((line) => line.kind === 'add')
    assert.equal(added[0].path, 'src/auth.ts')
    assert.ok(added.some((line) => line.text.includes('eval')))
  })

  it('counts added and deleted lines', () => {
    const stats = countHunk(DEMO_PULLS[0].diff)
    assert.ok(stats.added >= 3)
    assert.ok(stats.deleted >= 1)
  })
})

describe('review tools', () => {
  it('flags eval, innerHTML and a hard-coded password as blockers', () => {
    const review = reviewDiff('demo-12', DEMO_PULLS[0].diff)
    assert.equal(review.verdict, 'block')
    assert.ok(review.notes.every((note) => note.severity === 'blocker'))
    assert.ok(review.score.security < 50)
  })

  it('flags async map plus fetch as performance', () => {
    const review = reviewDiff('demo-18', DEMO_PULLS[1].diff)
    assert.ok(review.notes.some((note) => note.axis === 'performance'))
    assert.ok(review.score.performance < 80)
  })

  it('flags concatenated SQL as a security blocker', () => {
    const sql = DEMO_PULLS.find((pull) => pull.id === 'demo-24')
    assert.ok(sql)
    const review = reviewDiff('demo-24', sql.diff, 'pt')
    assert.ok(review.notes.some((note) => note.body.includes('SQL')))
    assert.equal(review.verdict, 'block')
  })

  it('keeps a typed webhook parse as ship', () => {
    const clean = DEMO_PULLS.find((pull) => pull.id === 'demo-21')
    assert.ok(clean)
    const review = reviewDiff('demo-21', clean.diff)
    assert.equal(review.notes.length, 0)
    assert.equal(review.verdict, 'ship')
    assert.ok(review.score.overall >= 80)
  })

  it('writes a markdown report with the verdict', () => {
    const pull = DEMO_PULLS[0]
    const review = reviewDiff(pull.id, pull.diff)
    const md = reviewMarkdown(pull, review)
    assert.ok(md.includes('Verdict'))
    assert.ok(md.includes('Security'))
  })
})

describe('score', () => {
  it('averages the three axes', () => {
    assert.equal(overallScore({ readability: 90, performance: 60, security: 30 }).overall, 60)
  })

  it('blocks a weak security score', () => {
    assert.equal(verdictFor({ readability: 90, performance: 90, security: 40, overall: 73 }), 'block')
  })
})
