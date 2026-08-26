import { parseUnifiedDiff } from './parse-diff'
import { overallScore } from './score'
import type { Axis, InlineNote, LocaleCode, ReviewRecord, Severity } from './types'
import { verdictFor } from './verdict'

type Rule = {
  axis: Axis
  severity: Severity
  test: (text: string) => boolean
  body: Record<LocaleCode, string>
  suggestion: Record<LocaleCode, string>
  cost: number
}

const RULES: Rule[] = [
  {
    axis: 'security',
    severity: 'blocker',
    test: (text) => /\beval\s*\(/.test(text) || /\bnew Function\s*\(/.test(text),
    body: {
      en: 'Dynamic code execution can run untrusted input.',
      pt: 'Execução dinâmica de código pode correr input não confiável.',
    },
    suggestion: {
      en: 'Parse data with JSON.parse or a schema. Never eval a string from a request.',
      pt: 'Lê os dados com JSON.parse ou um schema. Nunca faças eval de uma string do pedido.',
    },
    cost: 28,
  },
  {
    axis: 'security',
    severity: 'blocker',
    test: (text) => /\.innerHTML\s*=/.test(text) || /dangerouslySetInnerHTML/.test(text) || /document\.write/.test(text),
    body: {
      en: 'HTML injection on this line can open XSS.',
      pt: 'Injecção de HTML nesta linha pode abrir XSS.',
    },
    suggestion: {
      en: 'Use textContent or a sanitised renderer instead of innerHTML.',
      pt: 'Usa textContent ou um renderer sanitizado em vez de innerHTML.',
    },
    cost: 24,
  },
  {
    axis: 'security',
    severity: 'blocker',
    test: (text) => /(password|api[_-]?key|secret|token)\s*=\s*['"][^'"]+['"]/i.test(text),
    body: {
      en: 'A secret is hard-coded in the diff.',
      pt: 'Há um segredo escrito no diff.',
    },
    suggestion: {
      en: 'Read secrets from the environment, never from source.',
      pt: 'Lê os segredos do ambiente, nunca do código.',
    },
    cost: 30,
  },
  {
    axis: 'security',
    severity: 'blocker',
    test: (text) => /SELECT[\s\S]*\+/i.test(text) || /query\s*\+/.test(text),
    body: {
      en: 'SQL built with string concat can be injected.',
      pt: 'SQL montado com concatenação pode ser injectado.',
    },
    suggestion: {
      en: 'Use a parameterised query or an ORM bind.',
      pt: 'Usa uma query parametrizada ou um bind do ORM.',
    },
    cost: 26,
  },
  {
    axis: 'security',
    severity: 'blocker',
    test: (text) => /child_process|\bexec\s*\(/.test(text),
    body: {
      en: 'Shell execution on this line is a command-injection risk.',
      pt: 'Execução de shell nesta linha é risco de injecção de comando.',
    },
    suggestion: {
      en: 'Avoid exec. If you must, pass a fixed argv array, never a user string.',
      pt: 'Evita exec. Se precisares, passa um argv fixo, nunca uma string do utilizador.',
    },
    cost: 26,
  },
  {
    axis: 'performance',
    severity: 'warn',
    test: (text) => /\.map\s*\(\s*async/.test(text),
    body: {
      en: 'Async work inside map can fire sequential round-trips.',
      pt: 'Trabalho async dentro de map pode disparar idas sequenciais.',
    },
    suggestion: {
      en: 'Collect promises and await them together.',
      pt: 'Junta as promises e espera por todas de uma vez.',
    },
    cost: 16,
  },
  {
    axis: 'performance',
    severity: 'warn',
    test: (text) => /await\s+fetch/.test(text),
    body: {
      en: 'Fetch inside the loop of a list can grow with every id.',
      pt: 'Fetch dentro do ciclo de uma lista cresce com cada id.',
    },
    suggestion: {
      en: 'Batch the request or use Promise.all on a prepared list.',
      pt: 'Agrupa o pedido ou usa Promise.all numa lista preparada.',
    },
    cost: 16,
  },
  {
    axis: 'readability',
    severity: 'note',
    test: (text) => /:\s*any\b/.test(text) || /as any\b/.test(text),
    body: {
      en: 'any hides the contract of this change.',
      pt: 'any esconde o contrato desta alteração.',
    },
    suggestion: {
      en: 'Name the type or infer it from a schema.',
      pt: 'Dá nome ao tipo ou infere-o de um schema.',
    },
    cost: 10,
  },
  {
    axis: 'readability',
    severity: 'note',
    test: (text) => /\s==\s/.test(text) && !/\s===\s/.test(text),
    body: {
      en: 'Loose equality makes this hunk harder to trust.',
      pt: 'Igualdade frouxa torna este hunk mais difícil de confiar.',
    },
    suggestion: {
      en: 'Prefer === unless you truly want coercion.',
      pt: 'Prefere === a menos que queiras mesmo coerção.',
    },
    cost: 6,
  },
]

function summarise(locale: LocaleCode, notes: InlineNote[]): string {
  if (notes.length === 0) {
    return locale === 'pt'
      ? 'Sem notas a bloquear nas linhas adicionadas. Mantém a mesma barra no próximo hunk.'
      : 'No blocking notes on the added lines. Keep the same bar on the next hunk.'
  }
  const n = notes.length
  return locale === 'pt'
    ? `${n} nota${n === 1 ? '' : 's'} nas linhas adicionadas. Trata segurança primeiro, depois performance, depois nomes.`
    : `${n} note${n === 1 ? '' : 's'} on added lines. Fix security first, then performance, then names.`
}

export function reviewDiff(prId: string, diff: string, locale: LocaleCode = 'en'): ReviewRecord {
  const lines = parseUnifiedDiff(diff).filter((line) => line.kind === 'add')
  const notes: InlineNote[] = []
  let readability = 92
  let performance = 92
  let security = 94

  for (const line of lines) {
    for (const rule of RULES) {
      if (!rule.test(line.text)) continue
      notes.push({
        path: line.path,
        line: line.line,
        axis: rule.axis,
        severity: rule.severity,
        body: rule.body[locale],
        suggestion: rule.suggestion[locale],
      })
      if (rule.axis === 'security') security -= rule.cost
      if (rule.axis === 'performance') performance -= rule.cost
      if (rule.axis === 'readability') readability -= rule.cost
    }
  }

  const score = overallScore({ readability, performance, security })
  const hasBlocker = notes.some((note) => note.severity === 'blocker')
  return {
    prId,
    score,
    verdict: hasBlocker ? 'block' : verdictFor(score),
    summary: summarise(locale, notes),
    notes,
    engine: 'local',
    at: new Date().toISOString(),
  }
}
