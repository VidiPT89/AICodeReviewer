'use client'

import { useLocale } from '@/i18n/LocaleProvider'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function Landing() {
  const { t } = useLocale()
  const feats = [t.featApp, t.featHook, t.featDiff, t.featInline, t.featScore, t.featTheme]

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div>
        <h1 className="display amber text-6xl leading-none tracking-[-0.03em] sm:text-7xl">{t.brand}</h1>
        <p className="mt-4 text-2xl">{t.product}</p>
        <p className="muted mt-5 max-w-[42rem] text-lg leading-relaxed">{t.heroLead}</p>
        <div className="filament mt-8" />
        <Link href="/desk" className="btn mt-8 inline-block">
          {t.enter}
        </Link>
      </div>
      <div className="relative">
        <div className="wax-seal" aria-hidden />
        <motion.ul
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="sheet relative space-y-3 p-8"
        >
          {feats.map((feat) => (
            <li key={feat} className="flex items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: 'var(--line)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ember)' }} />
              {feat}
            </li>
          ))}
        </motion.ul>
      </div>
    </div>
  )
}
