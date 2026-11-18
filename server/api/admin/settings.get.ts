import { adminSettingsSchema } from '#shared/schemas/admin'
import { siteSettings } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'

function valueOf(rows: { key: string; value: unknown }[], key: string) {
  return rows.find(row => row.key === key)?.value
}

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const rows = await getDb().select().from(siteSettings)
  return adminSettingsSchema.parse({
    flags: (valueOf(rows, 'flags') as object) ?? undefined,
    announcement: valueOf(rows, 'announcement') ?? null,
    seo: (valueOf(rows, 'seo') as object) ?? undefined,
    social: (valueOf(rows, 'social') as object) ?? undefined,
  })
})
