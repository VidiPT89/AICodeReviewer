import { countHunk } from './diff-stats'
import type { PullCard } from './types'

function card(input: Omit<PullCard, 'added' | 'deleted'>): PullCard {
  return { ...input, ...countHunk(input.diff) }
}

export const DEMO_PULLS: PullCard[] = [
  card({
    id: 'demo-12',
    number: 12,
    title: 'Accept login tokens from the query string',
    repo: 'ividi/ledger',
    author: 'guest',
    opened: '2026-08-24T10:00:00.000Z',
    diff: `--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,8 +1,12 @@
 export function login(req: Request) {
-  const token = req.headers.get('authorization')
+  const token = new URL(req.url).searchParams.get('token')
+  const html = eval('"' + token + '"')
+  document.body.innerHTML = html
+  const password = 'hunter2'
   return token
 }
`,
  }),
  card({
    id: 'demo-18',
    number: 18,
    title: 'Load every user profile in a nested loop',
    repo: 'ividi/ledger',
    author: 'guest',
    opened: '2026-08-25T09:12:00.000Z',
    diff: `--- a/src/users.ts
+++ b/src/users.ts
@@ -1,6 +1,10 @@
 export async function hydrate(ids: string[]) {
-  return ids
+  return ids.map(async (id) => {
+    const row = await fetch('/api/users/' + id)
+    return row.json()
+  })
 }
`,
  }),
  card({
    id: 'demo-24',
    number: 24,
    title: 'Look up orders with a concatenated SQL string',
    repo: 'ividi/ledger',
    author: 'guest',
    opened: '2026-08-25T16:20:00.000Z',
    diff: `--- a/src/orders.ts
+++ b/src/orders.ts
@@ -1,4 +1,6 @@
 export function findOrder(id: string) {
-  return db.query('select * from orders where id = $1', [id])
+  const sql = 'SELECT * FROM orders WHERE id = ' + id
+  return db.query(sql)
 }
`,
  }),
  card({
    id: 'demo-21',
    number: 21,
    title: 'Parse the webhook payload with a named type',
    repo: 'ividi/ledger',
    author: 'guest',
    opened: '2026-08-26T08:40:00.000Z',
    diff: `--- a/src/hook.ts
+++ b/src/hook.ts
@@ -1,5 +1,8 @@
-export function parse(body: string) {
-  return JSON.parse(body)
+type Payload = { action: string; number: number }
+export function parse(body: string): Payload {
+  const payload = JSON.parse(body) as Payload
+  return payload
 }
`,
  }),
]
