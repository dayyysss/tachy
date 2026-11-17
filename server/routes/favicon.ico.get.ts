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

  const png32 = await sharp(buffer)
    .trim()
    .resize(30, 30, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 1, bottom: 1, left: 1, right: 1, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const icoHeader = Buffer.alloc(22)
  icoHeader.writeUInt16LE(0, 0)
  icoHeader.writeUInt16LE(1, 2)
  icoHeader.writeUInt16LE(1, 4)
  icoHeader.writeUInt8(32, 6)
  icoHeader.writeUInt8(32, 7)
  icoHeader.writeUInt8(0, 8)
  icoHeader.writeUInt8(0, 9)
  icoHeader.writeUInt16LE(1, 10)
  icoHeader.writeUInt16LE(32, 12)
  icoHeader.writeUInt32LE(png32.length, 14)
  icoHeader.writeUInt32LE(22, 18)

  const ico = Buffer.concat([icoHeader, png32])

  setHeader(event, 'content-type', 'image/x-icon')
  setHeader(event, 'cache-control', 'public, max-age=86400, immutable')
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'etag', `"favicon-ico-v${version}"`)
  return ico
})
