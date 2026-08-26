export function filledKey(value?: string): boolean {
  return (value?.trim().length ?? 0) > 8
}

export function hasGitHubApp(): boolean {
  return filledKey(process.env.GITHUB_APP_ID) && filledKey(process.env.GITHUB_PRIVATE_KEY)
}

export function hasWebhookSecret(): boolean {
  return filledKey(process.env.GITHUB_WEBHOOK_SECRET)
}

export function hasHostedModel(): boolean {
  return (
    filledKey(process.env.GROQ_API_KEY) ||
    filledKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
    filledKey(process.env.OPENAI_API_KEY) ||
    filledKey(process.env.ANTHROPIC_API_KEY)
  )
}
