import { and, eq, ilike, isNull, asc } from 'drizzle-orm'
import { files, folders } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const query = getQuery(event)
  const folder = typeof query.folder === 'string' && query.folder.startsWith('/') ? query.folder : '/'
  const q = typeof query.q === 'string' ? query.q : ''
  const type = typeof query.type === 'string' ? query.type : ''

  const filters = [eq(files.folder, folder), isNull(files.deletedAt)]
  if (q) filters.push(ilike(files.name, `%${q}%`))
  if (type) filters.push(ilike(files.mime, `${type}%`))

  const db = getDb()
  const [rows, folderRows] = await Promise.all([
    db.select().from(files).where(and(...filters)).orderBy(asc(files.name)).limit(200),
    db.select().from(folders).orderBy(asc(folders.path)).limit(500),
  ])

  return {
    folder,
    rows: rows.map(row => ({ ...row, url: publicFileUrl(row.bucket, row.objectKey) })),
    folders: folderRows,
  }
})
