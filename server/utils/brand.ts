import { and, eq } from 'drizzle-orm'
import sharp from 'sharp'
import { brandAssets, files } from '../db/schema/settings'
import { getDb, hasDatabase } from '../db'
import { getStorage } from './storage'

export const fallbackIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#121316"/>
  <path d="M190 170h132v44h-44v138c0 24 14 32 36 32 10 0 20-2 28-6v40c-12 6-28 8-44 8-50 0-70-24-70-68V214h-38v-44z" fill="#facc15"/>
</svg>`

export function bufferFromDataUrl(dataUrl: string): Buffer {
  if (dataUrl.startsWith('data:')) {
    const idx = dataUrl.indexOf(';base64,')
    return idx !== -1 ? Buffer.from(dataUrl.slice(idx + 8), 'base64') : Buffer.from(decodeURIComponent(dataUrl.slice(dataUrl.indexOf(',') + 1)))
  }
  return Buffer.from(dataUrl, 'base64')
}

export async function activeBrandFile(slot: string) {
  if (!hasDatabase()) return null
  try {
    const [row] = await getDb().select({
      bucket: files.bucket,
      objectKey: files.objectKey,
      mime: files.mime,
      dataUrl: files.dataUrl,
      version: brandAssets.version,
    }).from(brandAssets)
      .innerJoin(files, eq(brandAssets.fileId, files.id))
      .where(and(eq(brandAssets.slot, slot), eq(brandAssets.isActive, true)))
      .limit(1)
    return row ?? null
  } catch {
    return null
  }
}

export async function getBrandBuffer(slot: string): Promise<{ buffer: Buffer; mime: string; version: number } | null> {
  const source = await activeBrandFile(slot)
  if (source?.dataUrl) {
    return {
      buffer: bufferFromDataUrl(source.dataUrl),
      mime: source.mime,
      version: source.version,
    }
  }

  const storage = getStorage()
  if (source && storage) {
    const { data, error } = await storage.storage.from(source.bucket).download(source.objectKey)
    if (!error && data) {
      return {
        buffer: Buffer.from(await data.arrayBuffer()),
        mime: source.mime,
        version: source.version,
      }
    }
  }

  return null
}
