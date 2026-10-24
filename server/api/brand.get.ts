import { eq } from 'drizzle-orm'
import { bundledBrand, brandSlots } from '#shared/config/brand'
import { brandAssets, files } from '../db/schema/settings'
import { getDb, hasDatabase } from '../db'

export default defineEventHandler(async () => {
  const result: Record<string, { url: string | null; version: number; width: number | null; height: number | null }> = {}

  for (const slot of brandSlots) {
    result[slot.id] = { url: bundledBrand[slot.id] ?? null, version: 1, width: null, height: null }
  }

  if (!hasDatabase()) return result

  try {
    const rows = await getDb().select({
      slot: brandAssets.slot,
      version: brandAssets.version,
      bucket: files.bucket,
      objectKey: files.objectKey,
      width: files.width,
      height: files.height,
    }).from(brandAssets)
      .leftJoin(files, eq(brandAssets.fileId, files.id))
      .where(eq(brandAssets.isActive, true))

    for (const row of rows) {
      if (!row.bucket || !row.objectKey) continue
      result[row.slot] = {
        url: publicFileUrl(row.bucket, row.objectKey),
        version: row.version,
        width: row.width ?? null,
        height: row.height ?? null,
      }
    }
  } catch {
    // fall back to bundled assets
  }

  return result
})
