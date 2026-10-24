import sharp from 'sharp'

export default defineEventHandler(async event => {
  const source = await activeBrandFile('favicon')
  const storage = getStorage()
  if (!source || !storage) return sendRedirect(event, '/favicon.png', 302)

  const { data, error } = await storage.storage.from(source.bucket).download(source.objectKey)
  if (error || !data) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const png = await sharp(Buffer.from(await data.arrayBuffer()))
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toBuffer()

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=86400, immutable')
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'etag', `"favicon-ico-v${source.version}"`)
  return png
})
