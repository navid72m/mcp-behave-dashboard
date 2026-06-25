import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashToken } from '@/lib/tokens'

const FindingInput = z.object({
  type: z.string().min(1).max(64),
  severity: z.enum(['info', 'high']).default('high'),
  description: z.string().min(1).max(2000),
  detail: z.string().max(4000).optional(),
  toolName: z.string().max(200).optional(),
})

const ToolInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  inputSchema: z.string().max(20000).optional(),
})

const AuditIngest = z.object({
  server: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    githubUrl: z.string().url().optional(),
    npmPackage: z.string().max(200).optional(),
    author: z.string().max(200).optional(),
    transport: z.string().max(50).optional(),
    category: z.string().max(50).optional(),
    stars: z.number().int().nonnegative().optional(),
  }),
  audit: z.object({
    version: z.string().max(50).optional(),
    status: z.enum(['clean', 'findings', 'error']).default('clean'),
    exitCode: z.number().int().optional(),
    manifestHash: z.string().max(200).optional(),
    auditLog: z.string().max(100000).optional(),
  }),
  tools: z.array(ToolInput).max(500).default([]),
  findings: z.array(FindingInput).max(500).default([]),
})

async function authenticate(req: Request): Promise<{ userId: string; tokenId: string } | null> {
  const header = req.headers.get('authorization')
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null
  const plaintext = header.slice(7).trim()
  if (!plaintext) return null
  const token = await db.apiToken.findUnique({
    where: { tokenHash: hashToken(plaintext) },
    select: { id: true, userId: true },
  })
  return token ? { userId: token.userId, tokenId: token.id } : null
}

export async function POST(req: Request) {
  const auth = await authenticate(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  if (!json) return NextResponse.json({ error: 'invalid json' }, { status: 400 })

  const parsed = AuditIngest.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation failed', issues: parsed.error.issues }, { status: 400 })
  }
  const data = parsed.data

  const server = await db.mcpServer.upsert({
    where: { name: data.server.name },
    update: {
      githubUrl: data.server.githubUrl,
      npmPackage: data.server.npmPackage,
      author: data.server.author,
      transport: data.server.transport,
      category: data.server.category,
      ...(typeof data.server.stars === 'number' ? { stars: data.server.stars } : {}),
    },
    create: {
      name: data.server.name,
      description: data.server.description ?? '',
      githubUrl: data.server.githubUrl,
      npmPackage: data.server.npmPackage,
      author: data.server.author,
      transport: data.server.transport ?? 'stdio',
      category: data.server.category ?? 'other',
      stars: data.server.stars ?? 0,
    },
  })

  if (data.tools.length > 0) {
    await db.toolManifest.deleteMany({ where: { serverId: server.id } })
    await db.toolManifest.createMany({
      data: data.tools.map((t) => ({
        serverId: server.id,
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema ?? '{}',
      })),
    })
  }

  const audit = await db.audit.create({
    data: {
      serverId: server.id,
      version: data.audit.version ?? '0.1.0',
      status: data.audit.status,
      exitCode: data.audit.exitCode ?? 0,
      manifestHash: data.audit.manifestHash,
      auditLog: data.audit.auditLog ?? '',
      submittedById: auth.userId,
      findings: {
        create: data.findings.map((f) => ({
          type: f.type,
          severity: f.severity,
          description: f.description,
          detail: f.detail ?? '',
          toolName: f.toolName,
        })),
      },
    },
    select: { id: true, createdAt: true },
  })

  await db.apiToken.update({
    where: { id: auth.tokenId },
    data: { lastUsedAt: new Date() },
  })

  return NextResponse.json(
    { id: audit.id, serverId: server.id, createdAt: audit.createdAt },
    { status: 201 },
  )
}
