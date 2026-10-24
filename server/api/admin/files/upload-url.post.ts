import { randomUUID } from 'node:crypto'
import { uploadUrlSchema } from '#shared/schemas/files'
import { allowedMimeTypes } from '#shared/config/files'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')

  const storage = getStorage()
  if (!storage) throw createError({ statusCode: 503, statusMessage: 'Storage is not configured' })

  const parsed = uploadUrlSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid upload' })

  const rule = allowedMimeTypes[parsed.data.mime]
  if (!rule) throw createError({ statusCode: 415, statusMessage: 'File type not allowed' })
  if (parsed.data.size > rule.maxBytes) throw createError({ statusCode: 413, statusMessage: 'File too large' })
  if (parsed.data.folder.includes('..')) throw createError({ statusCode: 400, statusMessage: 'Invalid folder' })

  const fileId = randomUUID()
  const extension = rule.extensions[0]!
  const objectKey = `${fileId}.${extension}`
  const bucket = 'public'
  const { data, error } = await storage.storage.from(bucket).createSignedUploadUrl(objectKey)
  if (error || !data) throw createError({ statusCode: 502, statusMessage: error?.message ?? 'Could not create upload URL' })

  return {
    fileId,
    bucket,
    objectKey,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  }
})
