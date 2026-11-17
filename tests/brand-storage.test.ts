import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { publicFileUrl, storageConfigured } from '../server/utils/storage'
import { getBrandBuffer, bufferFromDataUrl, fallbackIconSvg } from '../server/utils/brand'
import { brandSlots } from '#shared/config/brand'

describe('Brand & Storage Integration', () => {
  it('defaults to internal storage when Supabase is not explicitly configured', () => {
    expect(storageConfigured()).toBe(false)
    const url = publicFileUrl('public', 'my-logo-a1b2c3d4.png')
    expect(url).toBe('/api/files/my-logo-a1b2c3d4.png')
  })

  it('handles null or empty objectKey safely', () => {
    expect(publicFileUrl('public', '')).toBe(null)
  })

  it('correctly decodes base64 dataUrls to Buffer', () => {
    const raw = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const buf = bufferFromDataUrl(raw)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })

  it('contains all required brand slots in config', () => {
    const slotIds = brandSlots.map(s => s.id)
    expect(slotIds).toContain('logo-on-light')
    expect(slotIds).toContain('logo-on-dark')
    expect(slotIds).toContain('logo-mark')
    expect(slotIds).toContain('favicon')
    expect(slotIds).toContain('og-default')
  })

  it('resolves active brand assets from database', async () => {
    const favicon = await getBrandBuffer('favicon')
    expect(favicon).not.toBeNull()
    expect(favicon?.mime).toBe('image/png')
    expect(favicon?.buffer.length).toBeGreaterThan(0)
    expect(favicon?.version).toBeGreaterThanOrEqual(1)

    const meta = await sharp(favicon!.buffer).metadata()
    expect(meta.width).toBeGreaterThanOrEqual(16)
    expect(meta.height).toBeGreaterThanOrEqual(16)
  })

  it('generates crisp resized icons for all requested PWA and favicon sizes', async () => {
    const favicon = await getBrandBuffer('favicon')
    expect(favicon).not.toBeNull()

    const targetSizes = [16, 32, 48, 180, 192, 512]
    for (const size of targetSizes) {
      const pad = Math.max(1, Math.round(size * 0.04))
      const inner = size - pad * 2

      const resized = await sharp(favicon!.buffer)
        .trim()
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      expect(resized.length).toBeGreaterThan(0)
      const meta = await sharp(resized).metadata()
      expect(meta.width).toBe(size)
      expect(meta.height).toBe(size)
    }
  })

  it('renders SVG in-memory fallback cleanly when asset is missing', async () => {
    const fallbackBuf = await sharp(Buffer.from(fallbackIconSvg)).png().toBuffer()
    expect(fallbackBuf.length).toBeGreaterThan(0)
    const meta = await sharp(fallbackBuf).metadata()
    expect(meta.width).toBe(512)
    expect(meta.height).toBe(512)
  })
})
