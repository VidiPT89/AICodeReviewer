import type { PullCard, ReviewRecord } from './types'

export function reviewMarkdown(pull: PullCard, review: ReviewRecord): string {
  const notes =
    review.notes.length === 0
      ? '- None'
      : review.notes
          .map(
            (note) =>
              `- **${note.severity}** \`${note.path}:${note.line}\` (${note.axis}): ${note.body}${
                note.suggestion ? ` Suggestion: ${note.suggestion}` : ''
              }`,
          )
          .join('\n')

  return [
    `# LUPA review · ${pull.repo}#${pull.number}`,
    '',
    pull.title,
    '',
    `Verdict: **${review.verdict}** · overall ${review.score.overall}/100`,
    '',
    `| Axis | Score |`,
    `|---|---|`,
    `| Readability | ${review.score.readability} |`,
    `| Performance | ${review.score.performance} |`,
    `| Security | ${review.score.security} |`,
    '',
    review.summary,
    '',
    '## Notes',
    notes,
    '',
  ].join('\n')
}
