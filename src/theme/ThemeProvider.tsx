'use client'

import { applyTheme, parseTheme, THEME_STORAGE, type Theme } from '@/lib/theme'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Ctx = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<Ctx | null>(null)

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return parseTheme(localStorage.getItem(THEME_STORAGE))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const id = requestAnimationFrame(() => setThemeState(readTheme()))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE, theme)
    applyTheme(theme)
  }, [theme])

  const value = useMemo<Ctx>(() => ({ theme, setTheme: setThemeState }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
