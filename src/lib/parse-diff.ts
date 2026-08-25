export type DiffLine = {
  path: string
  line: number
  kind: 'add' | 'del' | 'ctx'
  text: string
}

export function parseUnifiedDiff(diff: string): DiffLine[] {
  const out: DiffLine[] = []
  let path = 'unknown'
  let newLine = 0

  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ b/')) {
      path = raw.slice(6).trim() || path
      continue
    }
    if (raw.startsWith('@@')) {
      const match = raw.match(/\+(\d+)/)
      newLine = match ? Number(match[1]) : 0
      continue
    }
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      out.push({ path, line: newLine, kind: 'add', text: raw.slice(1) })
      newLine += 1
      continue
    }
    if (raw.startsWith('-') && !raw.startsWith('---')) {
      out.push({ path, line: newLine, kind: 'del', text: raw.slice(1) })
      continue
    }
    if (raw.startsWith(' ') || raw === '') {
      if (raw.startsWith(' ')) newLine += 1
    }
  }

  return out
}
