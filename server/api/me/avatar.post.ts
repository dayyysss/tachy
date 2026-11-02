import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { user } from '../../db/schema/auth'
import { getDb, hasDatabase } from '../../db'
import { getStorage, publicFileUrl } from '../../utils/storage'

export default defineEventHandler(async event => {
  const current = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Database not available' })

  const storage = getStorage()
  if (!storage) throw createError({ statusCode: 503, statusMessage: 'Storage service is not configured' })

  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'avatar' || item.name === 'file')
  if (!file || !file.data || !file.data.length) {
    throw createError({ statusCode: 400, statusMessage: 'No image file provided' })
  }

  // 5MB max
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Image exceeds 5MB size limit' })
  }

  // Optimize, crop square 256x256 WebP
  let processed: Buffer
  try {
    processed = await sharp(file.data)
      .rotate()
      .resize(256, 256, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer()
  } catch {
    throw createError({ statusCode: 415, statusMessage: 'Invalid image format. Please upload PNG, JPG, or WebP.' })
  }

  const objectKey = `avatars/${current.id}-${Date.now()}.webp`
  const { error: uploadErr } = await storage.storage
    .from('public')
    .upload(objectKey, processed, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (uploadErr) {
    throw createError({ statusCode: 502, statusMessage: uploadErr.message || 'Failed to save avatar image' })
  }

  const imageUrl = publicFileUrl('public', objectKey)
  if (!imageUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Could not resolve public avatar URL' })
  }

  await getDb().update(user).set({
    image: imageUrl,
    updatedAt: new Date(),
  }).where(eq(user.id, current.id))

  return {
    ok: true,
    image: imageUrl,
  }
})
