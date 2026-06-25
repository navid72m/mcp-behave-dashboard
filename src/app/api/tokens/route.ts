import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/tokens'

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: string } | undefined)?.id
  return id ?? null
}

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const tokens = await db.apiToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
  })
  return NextResponse.json({ tokens })
}

export async function POST(req: Request) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : 'default'

  const { plaintext, hash } = generateToken()
  const token = await db.apiToken.create({
    data: { userId, name, tokenHash: hash },
    select: { id: true, name: true, createdAt: true },
  })

  return NextResponse.json({ ...token, token: plaintext }, { status: 201 })
}
