import { adminSettingsSchema } from '#shared/schemas/admin'
import { siteSettings } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const parsed = adminSettingsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid settings' })

  const db = getDb()
  await db.transaction(async tx => {
    for (const key of ['flags', 'announcement', 'seo'] as const) {
      const value = parsed.data[key]
      await tx.insert(siteSettings).values({
        key,
        value: value ?? {},
        updatedBy: admin.id,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: value ?? {}, updatedBy: admin.id, updatedAt: new Date() },
      })
    }
  })

  await writeAudit(event, admin, 'settings.update', 'site_settings', null, null, parsed.data)
  return { ok: true }
})
