export function countHunk(diff: string): { added: number; deleted: number } {
  let added = 0
  let deleted = 0
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++') || raw.startsWith('---')) continue
    if (raw.startsWith('+')) added += 1
    else if (raw.startsWith('-')) deleted += 1
  }
  return { added, deleted }
}
