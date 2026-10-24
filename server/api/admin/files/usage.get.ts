import { count, isNull, sum, eq, and } from 'drizzle-orm'
import { files } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) return { files: 0, bytes: 0, limitBytes: 1024 * 1024 * 1024 }

  const [row] = await getDb().select({
    files: count(),
    bytes: sum(files.sizeBytes),
  }).from(files).where(isNull(files.deletedAt))

  return {
    files: Number(row?.files ?? 0),
    bytes: Number(row?.bytes ?? 0),
    limitBytes: Number(process.env.STORAGE_LIMIT_BYTES ?? 1024 * 1024 * 1024),
  }
})
