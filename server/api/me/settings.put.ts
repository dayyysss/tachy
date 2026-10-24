import { settingsSchema } from '#shared/schemas/settings'
import { userSettings } from '../../db/schema/stats'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const parsed = settingsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid settings' })

  await getDb().insert(userSettings).values({
    userId: user.id,
    settings: parsed.data,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: userSettings.userId,
    set: { settings: parsed.data, updatedAt: new Date() },
  })

  return { ok: true }
})
