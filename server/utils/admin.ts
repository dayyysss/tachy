import type { H3Event } from 'h3'
import { adminAuditLogs } from '../db/schema/settings'
import { getDb, hasDatabase } from '../db'

export interface AuditActor {
  id: string
  role?: string | null
}

export async function requireFreshReauth(event: H3Event, actor: AuditActor): Promise<void> {
  if (process.env.ADMIN_REQUIRE_2FA !== 'true') return
  const code = event.headers.get('x-admin-reauth')
  if (!code && process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, statusMessage: 'Fresh re-authentication code required for destructive action' })
  }
}

export async function writeAudit(
  event: H3Event,
  actor: AuditActor,
  action: string,
  targetType: string,
  targetId: string | null,
  before: unknown,
  after: unknown,
): Promise<void> {
  if (!hasDatabase()) return
  try {
    await getDb().insert(adminAuditLogs).values({
      actorId: actor.id,
      action,
      targetType,
      targetId,
      before: before ?? null,
      after: after ?? null,
      ip: (event.headers.get('x-forwarded-for') ?? event.node.req.socket.remoteAddress ?? '').split(',')[0]?.trim() || null,
      userAgent: event.headers.get('user-agent') ?? null,
    })
  } catch {
    // auditing must not break the admin action
  }
}
