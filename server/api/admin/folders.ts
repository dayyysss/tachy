import { and, eq, isNull } from 'drizzle-orm'
import { folderSchema } from '#shared/schemas/files'
import { files, folders } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const parsed = folderSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid folder path' })
  const path = parsed.data.path.replace(/\/+$/, '') || '/'

  const db = getDb()

  if (event.method === 'PATCH') {
    const body = await readBody(event)
    const oldPath = String(body?.oldPath ?? '').replace(/\/+$/, '') || '/'
    const newPath = String(body?.newPath ?? '').replace(/\/+$/, '') || '/'
    if (oldPath === '/' || newPath === '/') throw createError({ statusCode: 400, statusMessage: 'Cannot rename root' })
    if (oldPath === newPath) return { ok: true, path: newPath }

    await db.update(folders).set({ path: newPath }).where(eq(folders.path, oldPath))
    await db.update(files).set({ folder: newPath }).where(eq(files.folder, oldPath))
    await writeAudit(event, admin, 'folder.rename', 'folder', newPath, { oldPath }, { newPath })
    return { ok: true, path: newPath }
  }

  if (event.method === 'DELETE') {
    if (path === '/') throw createError({ statusCode: 400, statusMessage: 'Cannot delete root' })
    const [used] = await db.select({ id: files.id }).from(files).where(and(eq(files.folder, path), isNull(files.deletedAt))).limit(1)
    if (used) throw createError({ statusCode: 409, statusMessage: 'Folder is not empty' })
    await db.delete(folders).where(eq(folders.path, path))
    await writeAudit(event, admin, 'folder.delete', 'folder', path, null, null)
    return { ok: true }
  }

  await db.insert(folders).values({ path, createdBy: admin.id }).onConflictDoNothing()
  await writeAudit(event, admin, 'folder.create', 'folder', path, null, null)
  return { ok: true, path }
})
