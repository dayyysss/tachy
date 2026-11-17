import { createHash, randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { allowedMimeTypes, imageMimeTypes } from '#shared/config/files'
import { files } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'
import { sanitizeSvg, looksLikeSvg } from '../../../utils/sanitizeSvg'
import { writeAudit } from '../../../utils/admin'
import { getStorage, publicFileUrl } from '../../../utils/storage'

function sniff(bytes: Uint8Array): string | null {
  if (bytes.length < 8) return null
  const b = bytes
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (Buffer.from(b.slice(0, 4)).toString('ascii') === 'RIFF' && Buffer.from(b.slice(8, 12)).toString('ascii') === 'WEBP') return 'image/webp'
  if (Buffer.from(b.slice(4, 12)).toString('ascii').includes('ftypavi')) return 'image/avif'
  if (Buffer.from(b.slice(0, 4)).toString('ascii') === '%PDF') return 'application/pdf'
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return 'image/x-icon'
  if (looksLikeSvg(b)) return 'image/svg+xml'
  return null
}

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const form = await readMultipartFormData(event)
  if (!form || !form.length) {
    throw createError({ statusCode: 400, statusMessage: 'No multipart data uploaded' })
  }

  const fileItem = form.find(item => item.name === 'file')
  if (!fileItem || !fileItem.data || !fileItem.data.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file found in payload' })
  }

  const folderItem = form.find(item => item.name === 'folder')
  const folder = folderItem?.data ? folderItem.data.toString('utf8').trim() || '/' : '/'
  if (folder.includes('..')) throw createError({ statusCode: 400, statusMessage: 'Invalid folder path' })

  let buffer = fileItem.data
  const mime = sniff(buffer) || fileItem.type || 'application/octet-stream'
  const rule = allowedMimeTypes[mime]

  if (!rule) {
    throw createError({ statusCode: 415, statusMessage: `File type '${mime}' is not permitted` })
  }
  if (buffer.length > rule.maxBytes) {
    throw createError({ statusCode: 413, statusMessage: `File exceeds size limit (${Math.round(rule.maxBytes / 1024 / 1024)}MB)` })
  }

  if (mime === 'image/svg+xml') {
    buffer = Buffer.from(sanitizeSvg(buffer.toString('utf8')))
  }

  let width: number | null = null
  let height: number | null = null
  if (imageMimeTypes.has(mime)) {
    try {
      const meta = await sharp(buffer).metadata()
      width = meta.width ?? null
      height = meta.height ?? null
    } catch {
      width = null
      height = null
    }
  }

  const fileId = randomUUID()
  const rawFileName = fileItem.filename || 'uploaded-file'
  const lastDot = rawFileName.lastIndexOf('.')
  const ext = lastDot !== -1 ? rawFileName.substring(lastDot) : (rule.extensions[0] ? `.${rule.extensions[0]}` : '')
  const baseName = (lastDot !== -1 ? rawFileName.substring(0, lastDot) : rawFileName)
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file'
  const uniqueCode = randomUUID().replace(/-/g, '').slice(0, 8)
  const uniqueFileName = `${baseName}-${uniqueCode}${ext}`
  const objectKey = uniqueFileName
  const bucket = 'public'

  const storage = getStorage()
  if (storage) {
    await storage.storage.from(bucket).upload(objectKey, buffer, { contentType: mime, upsert: true }).catch(() => {})
  }

  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  const db = getDb()

  const [row] = await db.insert(files).values({
    id: fileId,
    bucket,
    objectKey,
    folder,
    name: uniqueFileName,
    mime,
    sizeBytes: buffer.length,
    width,
    height,
    checksum: createHash('sha256').update(buffer).digest('hex'),
    dataUrl,
    uploadedBy: admin.id,
  }).returning()

  await writeAudit(event, admin, 'file.upload', 'file', row!.id, null, {
    name: uniqueFileName,
    mime,
    size: buffer.length,
    folder,
  })

  return {
    ok: true,
    file: {
      ...row!,
      url: publicFileUrl(row!.bucket, row!.objectKey),
    },
  }
})
