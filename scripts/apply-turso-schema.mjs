import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '..', 'prisma', 'init.sql')

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url) {
  console.error('TURSO_DATABASE_URL is required')
  process.exit(1)
}

const client = createClient({ url, authToken })
const raw = readFileSync(sqlPath, 'utf8')
const stripComments = (s) =>
  s
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .trim()

const statements = raw
  .split(';')
  .map(stripComments)
  .filter((s) => s.length > 0)

for (const stmt of statements) {
  console.log('->', stmt.split('\n')[0].slice(0, 80))
  await client.execute(stmt)
}
console.log(`Applied ${statements.length} statements to ${url}`)
