import { eq } from 'drizzle-orm'
import { defaultSettings } from '#shared/schemas/settings'
import { userSettings } from '../../db/schema/stats'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) return defaultSettings
  try {
    const [row] = await getDb().select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1)
    return { ...defaultSettings, ...(row?.settings as object | undefined) }
  } catch {
    return defaultSettings
  }
})
