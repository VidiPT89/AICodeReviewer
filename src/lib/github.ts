import { App } from '@octokit/app'
import { Webhooks } from '@octokit/webhooks'
import { countHunk } from './diff-stats'
import { hasGitHubApp, hasWebhookSecret } from './keys'
import { reviewDiff } from './review'
import { rememberPull, saveReview } from './store'

function privateKey(): string {
  return (process.env.GITHUB_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
}

export function webhooks() {
  if (!hasWebhookSecret()) return null
  return new Webhooks({ secret: process.env.GITHUB_WEBHOOK_SECRET as string })
}

export async function reviewOpenedPull(input: {
  installationId: number
  owner: string
  repo: string
  number: number
  title: string
  author: string
}) {
  const id = `${input.owner}/${input.repo}#${input.number}`
  let diff = ''

  if (hasGitHubApp()) {
    const app = new App({
      appId: process.env.GITHUB_APP_ID as string,
      privateKey: privateKey(),
    })
    const octokit = await app.getInstallationOctokit(input.installationId)
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner: input.owner,
      repo: input.repo,
      pull_number: input.number,
      mediaType: { format: 'diff' },
    })
    diff = String(data)

    const review = reviewDiff(id, diff)
    saveReview(review)
    rememberPull({
      id,
      number: input.number,
      title: input.title,
      repo: `${input.owner}/${input.repo}`,
      author: input.author,
      opened: new Date().toISOString(),
      diff,
      ...countHunk(diff),
    })

    if (review.notes.length) {
      await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
        owner: input.owner,
        repo: input.repo,
        pull_number: input.number,
        event: 'COMMENT',
        body: `${review.summary}\n\nVerdict: ${review.verdict}. Score ${review.score.overall}/100 (readability ${review.score.readability}, performance ${review.score.performance}, security ${review.score.security}).`,
        comments: review.notes.slice(0, 12).map((note) => ({
          path: note.path,
          line: note.line,
          body: `${note.body}${note.suggestion ? `\n\nSuggestion: ${note.suggestion}` : ''}`,
        })),
      })
    }

    return review
  }

  const review = reviewDiff(id, diff || '+++ b/unknown\n@@ -0,0 +1,1 @@\n+placeholder\n')
  saveReview(review)
  return review
}
