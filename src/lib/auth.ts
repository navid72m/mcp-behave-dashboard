import type { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, profile }) {
      const p = profile as { id?: number | string; login?: string } | null
      const githubId = p?.id != null ? String(p.id) : null
      const login = p?.login
      if (!githubId || !login) return false
      await db.user.upsert({
        where: { githubId },
        update: {
          login,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        },
        create: {
          githubId,
          login,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        },
      })
      return true
    },
    async jwt({ token, profile }) {
      if (profile) {
        const githubId = String((profile as { id: number | string }).id)
        const dbUser = await db.user.findUnique({ where: { githubId } })
        if (dbUser) {
          token.userId = dbUser.id
          token.login = dbUser.login
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as { id?: string }).id = token.userId as string | undefined
        ;(session.user as { login?: string }).login = token.login as string | undefined
      }
      return session
    },
  },
}
