import { and, eq } from 'drizzle-orm'
import { brandAssets, files } from '../db/schema/settings'
import { getDb, hasDatabase } from '../db'

export async function activeBrandFile(slot: string) {
  if (!hasDatabase()) return null
  try {
    const [row] = await getDb().select({
      bucket: files.bucket,
      objectKey: files.objectKey,
      mime: files.mime,
      version: brandAssets.version,
    }).from(brandAssets)
      .innerJoin(files, eq(brandAssets.fileId, files.id))
      .where(and(eq(brandAssets.slot, slot), eq(brandAssets.isActive, true)))
      .limit(1)
    return row ?? null
  } catch {
    return null
  }
}
