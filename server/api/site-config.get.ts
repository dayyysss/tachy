import { eq } from 'drizzle-orm'
import { siteSettings } from '../db/schema'
import { getDb, hasDatabase } from '../db'
import { seoSchema } from '#shared/schemas/seo'
import { socialSchema } from '#shared/schemas/social'

const defaultFlags = {
  maintenance: false,
  signups: true,
  leaderboards: true,
  dailyChallenge: true,
}

export default defineEventHandler(async () => {
  const seo = seoSchema.parse({})
  const social = socialSchema.parse({})

  if (!hasDatabase()) {
    return { flags: defaultFlags, announcement: null, seo, social }
  }

  try {
    const db = getDb()
    const rows = await db.select().from(siteSettings)
    const value = (key: string) => rows.find(row => row.key === key)?.value
    return {
      flags: { ...defaultFlags, ...(value('flags') as object | undefined) },
      announcement: value('announcement') ?? null,
      seo: { ...seo, ...(value('seo') as object | undefined) },
      social: { ...social, ...(value('social') as object | undefined) },
    }
  } catch {
    return { flags: defaultFlags, announcement: null, seo, social }
  }
})

