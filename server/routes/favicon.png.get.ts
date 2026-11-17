import sharp from 'sharp'
import { getBrandBuffer, fallbackIconSvg } from '../utils/brand'

export default defineEventHandler(async event => {
  const brand = await getBrandBuffer('favicon')

  let buffer: Buffer
  let version = 1

  if (brand) {
    buffer = brand.buffer
    version = brand.version
  } else {
    buffer = await sharp(Buffer.from(fallbackIconSvg)).png().toBuffer()
  }

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=86400, immutable')
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'etag', `"favicon-png-v${version}"`)
  return buffer
})
