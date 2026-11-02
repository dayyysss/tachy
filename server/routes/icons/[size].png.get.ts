import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const sizes = new Set([16, 32, 48, 180, 192, 512])

export default defineEventHandler(async event => {
  const size = Number(getRouterParam(event, 'size'))
  if (!sizes.has(size)) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const source = await activeBrandFile('favicon')
  const storage = getStorage()

  let buffer: Buffer | null = null

  if (source && storage) {
    const { data, error } = await storage.storage.from(source.bucket).download(source.objectKey)
    if (!error && data) {
      buffer = Buffer.from(await data.arrayBuffer())
    }
  }

  if (!buffer) {
    const iconFile = path.resolve(process.cwd(), `public/icons/${size}.png`)
    if (fs.existsSync(iconFile)) {
      setHeader(event, 'content-type', 'image/png')
      setHeader(event, 'cache-control', 'public, max-age=86400, immutable')
      setHeader(event, 'x-content-type-options', 'nosniff')
      return fs.readFileSync(iconFile)
    }

    const fallbackPng = path.resolve(process.cwd(), 'public/favicon.png')
    if (fs.existsSync(fallbackPng)) {
      buffer = fs.readFileSync(fallbackPng)
    }
  }

  if (!buffer) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const pad = Math.max(1, Math.round(size * 0.04))
  const inner = size - pad * 2

  const png = await sharp(buffer)
    .trim()
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=86400, immutable')
  setHeader(event, 'x-content-type-options', 'nosniff')
  if (source) {
    setHeader(event, 'etag', `"favicon-${size}-v${source.version}"`)
  }
  return png
})
