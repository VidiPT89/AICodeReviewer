import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEMO_PULLS } from '../src/lib/demo-prs'
import { parseTheme } from '../src/lib/theme'
import { parseUnifiedDiff } from '../src/lib/parse-diff'
import { reviewDiff } from '../src/lib/review'
import { overallScore } from '../src/lib/score'

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
})

describe('review tools', () => {
  it('flags eval, innerHTML and a hard-coded password', () => {
    const review = reviewDiff('demo-12', DEMO_PULLS[0].diff)
    const axes = review.notes.map((note) => note.axis)
    assert.ok(axes.includes('security'))
    assert.ok(review.score.security < 50)
    assert.ok(review.notes.some((note) => note.suggestion))
  })

  it('flags async map plus fetch as performance', () => {
    const review = reviewDiff('demo-18', DEMO_PULLS[1].diff)
    assert.ok(review.notes.some((note) => note.axis === 'performance'))
    assert.ok(review.score.performance < 90)
  })

  it('keeps a typed webhook parse above 80 overall', () => {
    const review = reviewDiff('demo-21', DEMO_PULLS[2].diff)
    assert.equal(review.notes.length, 0)
    assert.ok(review.score.overall >= 80)
  })
})

describe('score', () => {
  it('averages the three axes', () => {
    assert.equal(overallScore({ readability: 90, performance: 60, security: 30 }).overall, 60)
  })
})
