'use client'

import { useLocale } from '@/i18n/LocaleProvider'
import { parseUnifiedDiff } from '@/lib/parse-diff'
import type { DeskPayload, PullCard, ReviewRecord } from '@/lib/types'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function ReviewDesk() {
  const { t } = useLocale()
  const [desk, setDesk] = useState<DeskPayload | null>(null)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/reviews')
    const data = (await res.json()) as DeskPayload
    setDesk(data)
    setActiveId((current) => current ?? data.pulls[0]?.id ?? null)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pulls = useMemo(() => {
    const list = desk?.pulls ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((pull) => `${pull.title} ${pull.repo} #${pull.number}`.toLowerCase().includes(q))
  }, [desk, query])

  const active: PullCard | undefined = desk?.pulls.find((pull) => pull.id === activeId)
  const review: ReviewRecord | undefined = active ? desk?.reviews[active.id] : undefined
  const hunks = active ? parseUnifiedDiff(active.diff) : []

  async function runReview() {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prId: active.id }),
      })
      if (!res.ok) throw new Error('fail')
      await load()
    } catch {
      setError(t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
      <section className="sheet p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="stamp">{desk?.githubApp ? t.liveMode : t.demoMode}</span>
          <span className="stamp">{desk?.hostedModel ? t.liveModel : t.localTools}</span>
        </div>
        <p className="muted mt-3 text-sm">{t.hint}</p>
        <input
          className="field mt-4"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
        />
        <ul className="mt-4 space-y-2">
          {pulls.length === 0 ? <li className="muted text-sm">{t.noMatch}</li> : null}
          {pulls.map((pull) => (
            <li key={pull.id}>
              <button
                type="button"
                className={`row ${pull.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(pull.id)}
              >
                <p className="display text-lg">#{pull.number}</p>
                <p>{pull.title}</p>
                <p className="faint mt-1 text-xs">
                  {pull.repo} · {pull.author}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet relative overflow-hidden p-6">
        <div className="scan" aria-hidden />
        {!active ? (
          <p className="muted">{t.empty}</p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="stamp">PR #{active.number}</p>
            <h2 className="mt-3 text-2xl">{active.title}</h2>
            <p className="muted mt-2 text-sm">
              {t.author}: {active.author} · {t.opened}: {active.opened.slice(0, 10)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn" disabled={busy} onClick={() => void runReview()}>
                {busy ? t.working : t.review}
              </button>
            </div>
            {error ? <p className="mt-3 text-sm" style={{ color: 'var(--ember)' }}>{error}</p> : null}

            {review ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <ScoreCard label={t.overall} value={review.score.overall} />
                <ScoreCard label={t.readability} value={review.score.readability} />
                <ScoreCard label={t.performance} value={review.score.performance} />
                <ScoreCard label={t.security} value={review.score.security} />
              </div>
            ) : null}

            {review ? (
              <div className="mt-6">
                <p className="faint text-xs uppercase tracking-[0.14em]">{t.summary}</p>
                <p className="mt-2">{review.summary}</p>
                <p className="muted mt-1 text-sm">
                  {t.engine}: {review.engine}
                </p>
              </div>
            ) : null}

            <div className="gutter mt-6 overflow-x-auto rounded-xl p-4 font-mono text-sm">
              {hunks.map((line, index) => (
                <div key={`${line.path}-${line.line}-${index}`} className={`diff-line ${line.kind}`}>
                  <span className="nr">{line.kind === 'add' ? line.line : ''}</span>
                  <span>{line.kind === 'add' ? '+' : line.kind === 'del' ? '-' : ' '}{line.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="faint text-xs uppercase tracking-[0.14em]">{t.notes}</p>
              {!review || review.notes.length === 0 ? (
                <p className="muted mt-2">{t.noNotes}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {review.notes.map((note, index) => (
                    <li key={`${note.path}-${note.line}-${index}`} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--line)' }}>
                      <span className={`stamp ${note.axis}`}>{note.axis}</span>
                      <p className="mt-2">
                        {note.path}:{note.line} · {note.body}
                      </p>
                      {note.suggestion ? (
                        <p className="muted mt-1 text-sm">
                          {t.suggestion}: {note.suggestion}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-card">
      <p className="faint text-xs uppercase tracking-[0.14em]">{label}</p>
      <p className="display amber mt-1 text-4xl">{value}</p>
    </div>
  )
}
