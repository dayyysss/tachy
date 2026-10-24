import { desc, eq } from 'drizzle-orm'
import { brandSlots } from '#shared/config/brand'
import { brandAssets, files } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) {
    return { slots: brandSlots.map(slot => ({ ...slot, active: null, versions: [] })) }
  }

  const rows = await getDb().select({
    slot: brandAssets.slot,
    version: brandAssets.version,
    isActive: brandAssets.isActive,
    createdAt: brandAssets.createdAt,
    fileId: files.id,
    name: files.name,
    mime: files.mime,
    bucket: files.bucket,
    objectKey: files.objectKey,
    width: files.width,
    height: files.height,
  }).from(brandAssets)
    .leftJoin(files, eq(brandAssets.fileId, files.id))
    .orderBy(desc(brandAssets.version))

  return {
    slots: brandSlots.map(slot => {
      const versions = rows.filter(row => row.slot === slot.id).map(row => ({
        ...row,
        url: row.bucket && row.objectKey ? publicFileUrl(row.bucket, row.objectKey) : null,
      }))
      return {
        ...slot,
        versions,
        active: versions.find(version => version.isActive) ?? null,
      }
    }),
  }
})
