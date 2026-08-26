export type Axis = 'readability' | 'performance' | 'security'
export type Severity = 'blocker' | 'warn' | 'note'
export type Verdict = 'block' | 'caution' | 'ship'
export type LocaleCode = 'pt' | 'en'

export type Score = {
  readability: number
  performance: number
  security: number
  overall: number
}

export type InlineNote = {
  path: string
  line: number
  axis: Axis
  severity: Severity
  body: string
  suggestion?: string
}

export type PullCard = {
  id: string
  number: number
  title: string
  repo: string
  author: string
  opened: string
  diff: string
  added: number
  deleted: number
}

export type ReviewRecord = {
  prId: string
  score: Score
  verdict: Verdict
  summary: string
  notes: InlineNote[]
  engine: 'local' | 'hosted'
  at: string
}

export type DeskPayload = {
  githubApp: boolean
  hostedModel: boolean
  pulls: PullCard[]
  reviews: Record<string, ReviewRecord>
}
