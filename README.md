# mcp-behave dashboard

Public audit registry for MCP servers. A Next.js dashboard that ingests audit
results from the [`mcp-behave`](https://github.com/navid72m/mcp-behave) CLI and
publishes them: per-server findings, manifest history, trust badges, and a
search/filter UI.

The CLI is the ground truth (it runs servers under `strace` and watches what
they actually do). This repo is the website where those reports live.

## What's in here

- **Dashboard** (`/`) — searchable list of audited servers, category filter,
  per-server detail dialog with findings, declared tools, and badge snippet.
- **Settings** (`/settings`) — GitHub-signed-in users mint API tokens for
  posting audits from CI.
- **Public API**
  - `GET /api/servers` — list with `?search`, `?category`, `?sort`
  - `GET /api/servers/[id]` — single server with full audit history
  - `GET /api/stats` — aggregate counts (servers, findings, categories)
  - `GET /api/badge?server=<name>` — shields.io-style SVG trust badge
  - `POST /api/audits` — token-auth ingest from `mcp-behave` CI runs
    (rate-limited to 20 req/min per token)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
Prisma 6 with the libSQL adapter (Turso in prod, local SQLite file in dev) ·
NextAuth (GitHub provider) · Vercel Analytics.

## Local setup

```bash
npm install
cp .env.example .env        # fill in the variables below
npm run db:push             # apply schema to ./db/custom.db
npm run db:seed             # optional: load 12 example servers
npm run dev                 # http://localhost:3000
```

### Environment variables

| Variable             | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| `TURSO_DATABASE_URL` | `file:./db/custom.db` for local, `libsql://…` for Turso      |
| `TURSO_AUTH_TOKEN`   | Required when `TURSO_DATABASE_URL` is a libsql:// URL        |
| `NEXTAUTH_URL`       | Public origin (e.g. `http://localhost:3000`)                 |
| `NEXTAUTH_SECRET`    | Any random 32+ byte string                                   |
| `GITHUB_ID`          | GitHub OAuth app client ID                                   |
| `GITHUB_SECRET`      | GitHub OAuth app client secret                               |

The GitHub OAuth app's authorization callback URL must be
`<NEXTAUTH_URL>/api/auth/callback/github`.

### Production database (Turso)

```bash
# Apply schema to a remote Turso DB
node scripts/apply-turso-schema.mjs

# Or run raw SQL migrations
node scripts/apply-turso-sql.mjs prisma/migrations/002-auth.sql
```

## Submitting an audit

Sign in with GitHub at `/settings`, mint a token, then have the CLI POST to
`/api/audits`:

```bash
curl -X POST https://<your-host>/api/audits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @audit.json
```

Payload shape (see [src/app/api/audits/route.ts](src/app/api/audits/route.ts)
for the full Zod schema):

```json
{
  "server":   { "name": "server-fetch", "githubUrl": "…", "category": "network" },
  "audit":    { "version": "0.1.0", "status": "findings", "exitCode": 3, "manifestHash": "…" },
  "tools":    [{ "name": "fetch", "description": "…" }],
  "findings": [{ "type": "network_egress", "severity": "high", "description": "…" }]
}
```

A repeat POST for the same `server.name` upserts the server and appends a new
audit row, so history is preserved.

## Trust badge

Embed in a server's README:

```markdown
![mcp-behave](https://<your-host>/api/badge?server=server-fetch)
```

Green for `clean`, red for high-severity findings, amber for info-only.

## Scripts

| Script              | What it does                                        |
|---------------------|-----------------------------------------------------|
| `npm run dev`       | Next dev server on port 3000                        |
| `npm run build`     | `prisma generate` + `next build`                    |
| `npm run start`     | Run the production build                            |
| `npm run lint`      | ESLint                                              |
| `npm run db:push`   | Push Prisma schema to the DB                        |
| `npm run db:seed`   | Seed 12 example servers                             |
| `npm run db:reset`  | Reset the DB (destructive)                          |

## Project layout

```
prisma/
  schema.prisma            McpServer, Audit, Finding, ToolManifest, User, ApiToken
  seed.ts                  12 example servers
  migrations/              Raw SQL for Turso
src/
  app/
    page.tsx               Dashboard
    settings/page.tsx      API token management
    api/                   servers, audits, stats, badge, tokens, auth
  components/ui/           shadcn/ui primitives
  lib/
    db.ts                  Prisma client with libSQL adapter
    auth.ts                NextAuth GitHub provider
    tokens.ts              Token mint + hash
    ratelimit.ts           20 req/min per token
```
