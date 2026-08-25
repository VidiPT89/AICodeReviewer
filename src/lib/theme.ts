export type Theme = 'dark' | 'light'

export const THEME_STORAGE = 'lupa-theme'

export function parseTheme(value?: string | null): Theme {
  return value === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}
