import { siteSettings } from '../db/schema/settings'
import { getDb, hasDatabase } from '../db'

let cache: { flags: Record<string, boolean>; at: number } | null = null

export async function getSiteFlags(): Promise<Record<string, boolean>> {
  const defaults = { maintenance: false, signups: true, leaderboards: true, dailyChallenge: true }
  if (!hasDatabase()) return defaults
  if (cache && Date.now() - cache.at < 30_000) return cache.flags
  try {
    const rows = await getDb().select().from(siteSettings)
    const value = rows.find(row => row.key === 'flags')?.value as Record<string, boolean> | undefined
    const flags = { ...defaults, ...(value ?? {}) }
    cache = { flags, at: Date.now() }
    return flags
  } catch {
    return defaults
  }
}
