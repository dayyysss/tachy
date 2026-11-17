import { eq, or } from 'drizzle-orm'
import { files } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'
import { getStorage } from '../../utils/storage'

export default defineEventHandler(async event => {
  const key = String(getRouterParam(event, 'key') ?? '')
  if (!key || !hasDatabase()) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const db = getDb()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)
  const conditions = [
    eq(files.objectKey, key),
    eq(files.name, key),
  ]
  if (isUuid) {
    conditions.push(eq(files.id, key))
  }

  const [row] = await db.select().from(files).where(
    or(...conditions)
  ).limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  if (row.dataUrl) {
    let buffer: Buffer
    if (row.dataUrl.startsWith('data:')) {
      const base64Index = row.dataUrl.indexOf(';base64,')
      if (base64Index !== -1) {
        buffer = Buffer.from(row.dataUrl.slice(base64Index + 8), 'base64')
      } else {
        const commaIndex = row.dataUrl.indexOf(',')
        buffer = Buffer.from(decodeURIComponent(row.dataUrl.slice(commaIndex + 1)))
      }
    } else {
      buffer = Buffer.from(row.dataUrl, 'base64')
    }

    setHeader(event, 'content-type', row.mime)
    setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
    setHeader(event, 'x-content-type-options', 'nosniff')
    setHeader(event, 'access-control-allow-origin', '*')
    if (row.checksum) {
      setHeader(event, 'etag', `"${row.checksum}"`)
    }
    return buffer
  }

  const storage = getStorage()
  if (storage) {
    const { data: blob, error } = await storage.storage.from(row.bucket).download(row.objectKey)
    if (!error && blob) {
      const buffer = Buffer.from(await blob.arrayBuffer())
      setHeader(event, 'content-type', row.mime)
      setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
      setHeader(event, 'x-content-type-options', 'nosniff')
      setHeader(event, 'access-control-allow-origin', '*')
      return buffer
    }
  }

  throw createError({ statusCode: 404, statusMessage: 'File content unavailable' })
})
