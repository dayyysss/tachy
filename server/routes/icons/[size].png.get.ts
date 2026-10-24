import sharp from 'sharp'

const sizes = new Set([16, 32, 48, 180, 192, 512])

export default defineEventHandler(async event => {
  const size = Number(getRouterParam(event, 'size'))
  if (!sizes.has(size)) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const source = await activeBrandFile('favicon')
  const storage = getStorage()
  if (!source || !storage) return sendRedirect(event, '/favicon.png', 302)

  const { data, error } = await storage.storage.from(source.bucket).download(source.objectKey)
  if (error || !data) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const png = await sharp(Buffer.from(await data.arrayBuffer()))
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer()

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', `public, max-age=86400, immutable`)
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'etag', `"favicon-${size}-v${source.version}"`)
  return png
})
