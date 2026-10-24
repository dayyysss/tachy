import type { H3Event } from 'h3'
import { getAuth, isAuthConfigured } from './auth'

export interface SessionUser {
  id: string
  email: string
  name: string
  username?: string | null
  role?: string | null
  isPublic?: boolean
  timezone?: string
  twoFactorEnabled?: boolean
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  if (!isAuthConfigured()) return null
  try {
    const session = await getAuth().api.getSession({ headers: event.headers })
    return (session?.user as SessionUser) ?? null
  } catch {
    return null
  }
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  return user
}

export async function requireRole(event: H3Event, role: 'moderator' | 'admin') {
  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const rank = { user: 0, moderator: 1, admin: 2 } as const
  const current = (user.role ?? 'user') as keyof typeof rank
  if (rank[current] < rank[role]) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return user
}


