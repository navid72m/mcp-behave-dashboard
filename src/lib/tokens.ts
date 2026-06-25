import { createHash, randomBytes } from 'node:crypto'

const PREFIX = 'mcpb_'

export function generateToken(): { plaintext: string; hash: string } {
  const plaintext = PREFIX + randomBytes(32).toString('hex')
  const hash = hashToken(plaintext)
  return { plaintext, hash }
}

export function hashToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}
