'use client'

import { useLocale } from '@/i18n/LocaleProvider'
import { parseUnifiedDiff } from '@/lib/parse-diff'
import { reviewMarkdown } from '@/lib/report'
import type { Axis, DeskPayload, PullCard, ReviewRecord, Verdict } from '@/lib/types'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

type AxisFilter = 'all' | Axis

async function fetchDesk(): Promise<DeskPayload> {
  const res = await fetch('/api/reviews')
  return (await res.json()) as DeskPayload
}

export function ReviewDesk() {
  const { t, locale } = useLocale()
  const [desk, setDesk] = useState<DeskPayload | null>(null)
  const [query, setQuery] = useState('')
  const [axis, setAxis] = useState<AxisFilter>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [paste, setPaste] = useState('')
  const [pasteTitle, setPasteTitle] = useState('')
  const [hit, setHit] = useState<number | null>(null)

  const apply = useCallback((data: DeskPayload) => {
    setDesk(data)
    setActiveId((current) => current ?? data.pulls[0]?.id ?? null)
  }, [])

  const load = useCallback(async () => {
    apply(await fetchDesk())
  }, [apply])

  useEffect(() => {
    let ignore = false
    fetchDesk()
      .then((data) => {
        if (!ignore) apply(data)
      })
      .catch(() => {
        /* offline: the desk stays empty */
      })
    return () => {
      ignore = true
    }
  }, [apply])

  const pulls = useMemo(() => {
    const list = desk?.pulls ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((pull) => `${pull.title} ${pull.repo} #${pull.number}`.toLowerCase().includes(q))
  }, [desk, query])

  const active: PullCard | undefined = desk?.pulls.find((pull) => pull.id === activeId)
  const review: ReviewRecord | undefined = active ? desk?.reviews[active.id] : undefined
  const hunks = active ? parseUnifiedDiff(active.diff) : []
  const notes = (review?.notes ?? []).filter((note) => axis === 'all' || note.axis === axis)

  async function runReview(body: Record<string, string>) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, locale }),
      })
      const data = (await res.json()) as { pull?: PullCard; error?: string }
      if (!res.ok) throw new Error('fail')
      await load()
      if (data.pull) setActiveId(data.pull.id)
    } catch {
      setError(t.error)
    } finally {
      setBusy(false)
    }
  }

  async function copyReport() {
    if (!active || !review) return
    await navigator.clipboard.writeText(reviewMarkdown(active, review))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const verdictLabel = (value: Verdict) => (value === 'block' ? t.block : value === 'caution' ? t.caution : t.ship)

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
      <section className="sheet space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="stamp">{desk?.githubApp ? t.liveMode : t.demoMode}</span>
          <span className="stamp">{desk?.hostedModel ? t.liveModel : t.localTools}</span>
        </div>
        <p className="muted text-sm">{t.hint}</p>
        <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
        <div className="seg" role="group">
          {(['all', 'security', 'performance', 'readability'] as const).map((key) => (
            <button key={key} type="button" className={axis === key ? 'on' : ''} onClick={() => setAxis(key)}>
              {key === 'all' ? t.all : key === 'security' ? t.security : key === 'performance' ? t.performance : t.readability}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {pulls.length === 0 ? <li className="muted text-sm">{t.noMatch}</li> : null}
          {pulls.map((pull) => {
            const cardReview = desk?.reviews[pull.id]
            return (
              <li key={pull.id}>
                <button type="button" className={`row ${pull.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(pull.id)}>
                  <p className="display text-lg">#{pull.number}</p>
                  <p>{pull.title}</p>
                  <p className="faint mt-1 text-xs">
                    +{pull.added} / -{pull.deleted} · {pull.repo}
                    {cardReview ? ` · ${cardReview.score.overall}` : ''}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
        <div>
          <p className="faint text-xs uppercase tracking-[0.14em]">{t.paste}</p>
          <p className="muted mt-1 text-sm">{t.pasteHint}</p>
          <input className="field mt-3" value={pasteTitle} onChange={(event) => setPasteTitle(event.target.value)} placeholder={t.pasteTitle} />
          <textarea className="field mt-2 min-h-32 font-mono text-sm" value={paste} onChange={(event) => setPaste(event.target.value)} />
          <button
            type="button"
            className="btn mt-3"
            disabled={busy || !paste.includes('+++')}
            onClick={() => void runReview({ diff: paste, title: pasteTitle })}
          >
            {t.runPaste}
          </button>
        </div>
      </section>

      <section className="sheet relative overflow-hidden p-6">
        <div className="scan" aria-hidden />
        {!active ? (
          <p className="muted">{t.empty}</p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="stamp">PR #{active.number}</span>
              {review ? <span className={`stamp ${review.verdict}`}>{verdictLabel(review.verdict)}</span> : null}
            </div>
            <h2 className="mt-3 text-2xl">{active.title}</h2>
            <p className="muted mt-2 text-sm">
              {t.author}: {active.author} · +{active.added} {t.added} · -{active.deleted} {t.deleted}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn" disabled={busy} onClick={() => void runReview({ prId: active.id })}>
                {busy ? t.working : t.review}
              </button>
              {review ? (
                <button type="button" className="btn-ghost" onClick={() => void copyReport()}>
                  {copied ? t.copied : t.copy}
                </button>
              ) : null}
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
              </div>
            ) : null}

            <div className="gutter mt-6 overflow-x-auto rounded-xl p-4 font-mono text-sm">
              {hunks.map((line, index) => (
                <div
                  key={`${line.path}-${line.line}-${index}`}
                  className={`diff-line ${line.kind} ${hit === line.line && line.kind === 'add' ? 'hit' : ''}`}
                >
                  <span className="nr">{line.kind === 'add' ? line.line : ''}</span>
                  <span>
                    {line.kind === 'add' ? '+' : line.kind === 'del' ? '-' : ' '}
                    {line.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="faint text-xs uppercase tracking-[0.14em]">{t.notes}</p>
              {notes.length === 0 ? (
                <p className="muted mt-2">{t.noNotes}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {notes.map((note, index) => (
                    <li key={`${note.path}-${note.line}-${index}`} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--line)' }}>
                      <button type="button" className="text-left" onClick={() => setHit(note.line)}>
                        <span className={`stamp ${note.severity}`}>{note.severity === 'blocker' ? t.blocker : note.severity === 'warn' ? t.warn : t.note}</span>
                        <span className={`stamp ${note.axis} ml-2`}>{note.axis}</span>
                        <p className="mt-2">
                          {note.path}:{note.line} · {note.body}
                        </p>
                        {note.suggestion ? (
                          <p className="muted mt-1 text-sm">
                            {t.suggestion}: {note.suggestion}
                          </p>
                        ) : null}
                        <p className="amber mt-1 text-xs">{t.jump}</p>
                      </button>
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
      <div className="meter mt-2">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
