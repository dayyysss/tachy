import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { files, brandAssets } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folder: z.string().min(1).max(256).regex(/^\/[a-zA-Z0-9/_-]*$/).optional(),
})

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const db = getDb()
  const [row] = await db.select().from(files).where(eq(files.id, id)).limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  if (event.method === 'DELETE') {
    await requireFreshReauth(event, admin)
    const [inUse] = await db.select({ slot: brandAssets.slot }).from(brandAssets).where(and(
      eq(brandAssets.fileId, id),
      eq(brandAssets.isActive, true),
    )).limit(1)
    if (inUse) throw createError({ statusCode: 409, statusMessage: `File is in use by ${inUse.slot}` })

    const storage = getStorage()
    if (storage) await storage.storage.from(row.bucket).remove([row.objectKey])
    await db.delete(files).where(eq(files.id, id))
    await writeAudit(event, admin, 'file.delete', 'file', id, { name: row.name }, null)
    return { ok: true }
  }

  const parsed = patchSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid patch' })

  const [updated] = await db.update(files).set({
    ...(parsed.data.name ? { name: parsed.data.name } : {}),
    ...(parsed.data.folder ? { folder: parsed.data.folder } : {}),
  }).where(eq(files.id, id)).returning()

  await writeAudit(event, admin, 'file.update', 'file', id, { name: row.name, folder: row.folder }, parsed.data)
  return { file: updated }
})
