import { db } from '@/lib/db'

const WINDOW_MS = 60_000
const LIMIT = 20

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: Date }
  | { ok: false; retryAfterSec: number; resetAt: Date }

export async function checkAuditRateLimit(tokenId: string): Promise<RateLimitResult> {
  const now = new Date()
  const token = await db.apiToken.findUnique({
    where: { id: tokenId },
    select: { rateLimitWindowStart: true, rateLimitCount: true },
  })
  if (!token) {
    return { ok: false, retryAfterSec: 60, resetAt: new Date(now.getTime() + WINDOW_MS) }
  }

  const start = token.rateLimitWindowStart
  const withinWindow = start && now.getTime() - start.getTime() < WINDOW_MS
  const currentCount = withinWindow ? token.rateLimitCount : 0
  const newWindowStart = withinWindow ? start! : now

  if (currentCount >= LIMIT) {
    const resetAt = new Date(newWindowStart.getTime() + WINDOW_MS)
    const retryAfterSec = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000))
    return { ok: false, retryAfterSec, resetAt }
  }

  await db.apiToken.update({
    where: { id: tokenId },
    data: {
      rateLimitWindowStart: newWindowStart,
      rateLimitCount: currentCount + 1,
      lastUsedAt: now,
    },
  })

  return {
    ok: true,
    remaining: LIMIT - (currentCount + 1),
    resetAt: new Date(newWindowStart.getTime() + WINDOW_MS),
  }
}

export const RATE_LIMIT = LIMIT
export const RATE_WINDOW_MS = WINDOW_MS
