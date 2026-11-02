import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export default defineEventHandler(async event => {
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
    const fallbackIco = path.resolve(process.cwd(), 'public/favicon.ico')
    if (fs.existsSync(fallbackIco)) {
      setHeader(event, 'content-type', 'image/x-icon')
      setHeader(event, 'cache-control', 'public, max-age=86400')
      setHeader(event, 'x-content-type-options', 'nosniff')
      return fs.readFileSync(fallbackIco)
    }

    const fallbackPng = path.resolve(process.cwd(), 'public/favicon.png')
    if (fs.existsSync(fallbackPng)) {
      buffer = fs.readFileSync(fallbackPng)
    }
  }

  if (!buffer) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
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
  if (source) {
    setHeader(event, 'etag', `"favicon-ico-v${source.version}"`)
  }
  return ico
})
