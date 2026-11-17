import sharp from 'sharp'
import { getBrandBuffer, fallbackIconSvg } from '../../utils/brand'

export default defineEventHandler(async event => {
  const rawParam = String(getRouterParam(event, 'size') ?? '')
  const digits = rawParam.replace(/\D/g, '')
  const size = digits ? Number(digits) : (rawParam.includes('apple') ? 180 : 192)

  if (size < 16 || size > 1024) {
    throw createError({ statusCode: 404, statusMessage: 'Invalid icon size' })
  }

  const brand = await getBrandBuffer('favicon')

  let buffer: Buffer
  let version = 1

  if (brand) {
    buffer = brand.buffer
    version = brand.version
  } else {
    buffer = await sharp(Buffer.from(fallbackIconSvg)).png().toBuffer()
  }

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
  setHeader(event, 'etag', `"favicon-${size}-v${version}"`)
  return png
})
