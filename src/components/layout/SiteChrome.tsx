'use client'

import { useLocale } from '@/i18n/LocaleProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function SiteChrome({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const onDesk = pathname === '/desk'

  return (
    <div className="relative z-10 min-h-dvh">
      <header className="sticky top-4 z-20 mx-auto w-[min(1280px,calc(100%-1.5rem))]">
        <div className="chrome flex flex-wrap items-center justify-between gap-3 rounded-full px-4 py-2 backdrop-blur-md">
          <Link href="/" className="display amber text-xl tracking-[0.28em]">
            {t.brand}
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/desk" className={onDesk ? 'btn' : 'btn-ghost'}>
              {t.enter}
            </Link>
            <div className="seg" role="group" aria-label={t.theme}>
              <button type="button" className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>
                {t.dark}
              </button>
              <button type="button" className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>
                {t.light}
              </button>
            </div>
            <div className="seg" role="group" aria-label="Idioma">
              <button type="button" className={locale === 'pt' ? 'on' : ''} onClick={() => setLocale('pt')}>
                PT
              </button>
              <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>
                EN
              </button>
            </div>
          </nav>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="mx-auto w-[min(1280px,calc(100%-1.5rem))] py-10"
      >
        {children}
      </motion.main>

      <footer className="mx-auto mt-8 w-[min(1280px,calc(100%-1.5rem))] border-t py-10 text-center text-sm muted" style={{ borderColor: 'var(--line)' }}>
        <p className="display amber text-lg tracking-[0.28em]">{t.brand}</p>
        <p className="mt-2">{t.tagline}</p>
        <p className="mt-4">{t.developed}</p>
        <p className="mt-2 flex justify-center gap-4">
          <a href="https://ividi.dev/" className="amber hover:opacity-80">
            ividi.dev
          </a>
          <a href="https://github.com/VidiPT89/" className="amber hover:opacity-80">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
