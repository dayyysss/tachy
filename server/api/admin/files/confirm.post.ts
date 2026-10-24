import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { confirmUploadSchema } from '#shared/schemas/files'
import { allowedMimeTypes, imageMimeTypes } from '#shared/config/files'
import { files } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'
import { sanitizeSvg, looksLikeSvg } from '../../../utils/sanitizeSvg'

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

  const storage = getStorage()
  if (!storage) throw createError({ statusCode: 503, statusMessage: 'Storage is not configured' })

  const parsed = confirmUploadSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid confirm payload' })
  const input = parsed.data

  const bucket = storage.storage.from(input.bucket)
  const { data: blob, error } = await bucket.download(input.objectKey)
  if (error || !blob) throw createError({ statusCode: 400, statusMessage: 'Uploaded object not found' })

  let buffer = Buffer.from(await blob.arrayBuffer())
  const mime = sniff(buffer)
  const rule = mime ? allowedMimeTypes[mime] : null

  if (!mime || !rule || buffer.length > rule.maxBytes) {
    await bucket.remove([input.objectKey])
    throw createError({ statusCode: 415, statusMessage: 'File type not allowed or too large' })
  }

  if (mime === 'image/svg+xml') {
    buffer = Buffer.from(sanitizeSvg(buffer.toString('utf8')))
    await bucket.remove([input.objectKey])
    const { error: reuploadError } = await bucket.upload(input.objectKey, buffer, { contentType: mime, upsert: true })
    if (reuploadError) throw createError({ statusCode: 502, statusMessage: 'Could not sanitize upload' })
  }

  let width: number | null = null
  let height: number | null = null
  if (imageMimeTypes.has(mime)) {
    try {
      const metadata = await sharp(buffer).metadata()
      width = metadata.width ?? null
      height = metadata.height ?? null
    } catch {
      width = null
    }
  }

  const [row] = await getDb().insert(files).values({
    id: input.fileId,
    bucket: input.bucket,
    objectKey: input.objectKey,
    folder: input.folder,
    name: input.name,
    mime,
    sizeBytes: buffer.length,
    width,
    height,
    checksum: createHash('sha256').update(buffer).digest('hex'),
    uploadedBy: admin.id,
  }).returning()

  await writeAudit(event, admin, 'file.upload', 'file', row!.id, null, { name: input.name, mime })
  return { file: row }
})
