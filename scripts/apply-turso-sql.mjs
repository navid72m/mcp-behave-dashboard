import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url) {
  console.error('TURSO_DATABASE_URL is required')
  process.exit(1)
}
const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/apply-turso-sql.mjs <path-to-sql>')
  process.exit(1)
}

const stripComments = (s) =>
  s
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .trim()

const raw = readFileSync(resolve(file), 'utf8')
const statements = raw
  .split(';')
  .map(stripComments)
  .filter((s) => s.length > 0)

const client = createClient({ url, authToken })
for (const stmt of statements) {
  console.log('->', stmt.split('\n')[0].slice(0, 80))
  await client.execute(stmt)
}
console.log(`Applied ${statements.length} statements to ${url}`)
