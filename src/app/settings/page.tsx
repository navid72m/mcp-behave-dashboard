'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, Copy, Check, Trash2, KeyRound, LogOut } from 'lucide-react'

type TokenRow = {
  id: string
  name: string
  lastUsedAt: string | null
  createdAt: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [loading, setLoading] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function loadTokens() {
    setLoading(true)
    const res = await fetch('/api/tokens')
    if (res.ok) {
      const data = await res.json()
      setTokens(data.tokens)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (session) loadTokens()
  }, [session])

  async function createToken() {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: newTokenName || 'default' }),
    })
    if (res.ok) {
      const data = await res.json()
      setCreatedToken(data.token)
      setNewTokenName('')
      await loadTokens()
    }
  }

  async function deleteToken(id: string) {
    if (!confirm('Revoke this token? Any auditor using it will start getting 401s.')) return
    const res = await fetch(`/api/tokens/${id}`, { method: 'DELETE' })
    if (res.ok) await loadTokens()
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (status === 'loading') {
    return <div className="p-8 text-muted-foreground">Loading…</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with GitHub to mint API tokens and submit audit results.
            </p>
            <Button onClick={() => signIn('github')} className="w-full">
              <Github className="h-4 w-4 mr-2" />
              Continue with GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const user = session.user as { name?: string; image?: string; login?: string } | undefined

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
          )}
          <div>
            <div className="font-medium">{user?.name ?? user?.login ?? 'You'}</div>
            <div className="text-sm text-muted-foreground">@{user?.login}</div>
          </div>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> API tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use a token from your auditor (CLI / CI) to <code>POST /api/audits</code> with{' '}
            <code>Authorization: Bearer …</code>. Tokens are shown once.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Token name (e.g. laptop, ci, mcp-behave-cli)"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
            />
            <Button onClick={createToken}>Create token</Button>
          </div>

          {createdToken && (
            <div className="border rounded-md p-3 bg-yellow-500/10 border-yellow-500/30 space-y-2">
              <div className="text-sm font-medium">
                Copy this token now — you won&apos;t see it again.
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background px-2 py-2 rounded break-all">
                  {createdToken}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(createdToken)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setCreatedToken(null)}>
                Got it
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {!loading && tokens.length === 0 && (
              <div className="text-sm text-muted-foreground">No tokens yet.</div>
            )}
            {tokens.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border rounded-md px-3 py-2"
              >
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(t.createdAt).toLocaleDateString()}
                    {t.lastUsedAt
                      ? ` · Last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                      : ' · Never used'}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteToken(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit an audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            POST a JSON body to <code>/api/audits</code> with your token:
          </p>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">{`curl -X POST https://<your-app>.vercel.app/api/audits \\
  -H "authorization: Bearer mcpb_…" \\
  -H "content-type: application/json" \\
  -d '{
    "server": {
      "name": "my-mcp-server",
      "description": "Optional on update; required on first audit",
      "githubUrl": "https://github.com/you/repo",
      "category": "local",
      "transport": "stdio"
    },
    "audit": {
      "version": "0.1.0",
      "status": "findings",
      "exitCode": 3,
      "manifestHash": "sha256:..."
    },
    "tools": [
      { "name": "do_thing", "description": "Does the thing." }
    ],
    "findings": [
      {
        "type": "network_egress",
        "severity": "high",
        "description": "Undeclared egress",
        "detail": "1.2.3.4:443",
        "toolName": "do_thing"
      }
    ]
  }'`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
