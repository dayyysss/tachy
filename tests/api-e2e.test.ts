import { describe, expect, it } from 'vitest'
import { getDb, hasDatabase } from '../server/db'
import { files, brandAssets, folders } from '../server/db/schema/settings'
import { user } from '../server/db/schema/auth'
import { eq, or, and } from 'drizzle-orm'
import sharp from 'sharp'

describe('End-to-End Database & Feature Integrity', () => {
  it('connects to PostgreSQL database successfully', () => {
    expect(hasDatabase()).toBe(true)
    const db = getDb()
    expect(db).toBeDefined()
  })

  it('verifies superadmin user exists with admin role in database', async () => {
    const db = getDb()
    const targetEmail = process.env.ADMIN_EMAIL || 'daynibos@gmail.com'
    const [admin] = await db.select().from(user).where(eq(user.email, targetEmail)).limit(1)
    expect(admin).toBeDefined()
    expect(admin?.role).toBe('admin')
    expect(admin?.emailVerified).toBe(true)
  })

  it('verifies /brand folder exists in folders table', async () => {
    const db = getDb()
    const [folder] = await db.select().from(folders).where(eq(folders.path, '/brand')).limit(1)
    expect(folder).toBeDefined()
  })

  it('verifies all 5 required brand slots are populated and active in database', async () => {
    const db = getDb()
    const activeSlots = await db.select({
      slot: brandAssets.slot,
      version: brandAssets.version,
      objectKey: files.objectKey,
      mime: files.mime,
      hasDataUrl: files.dataUrl,
    }).from(brandAssets)
      .innerJoin(files, eq(brandAssets.fileId, files.id))
      .where(eq(brandAssets.isActive, true))

    const foundSlots = activeSlots.map(s => s.slot)
    expect(foundSlots).toContain('logo-on-light')
    expect(foundSlots).toContain('logo-on-dark')
    expect(foundSlots).toContain('logo-mark')
    expect(foundSlots).toContain('favicon')
    expect(foundSlots).toContain('og-default')

    for (const item of activeSlots) {
      expect(item.objectKey).toBeDefined()
      expect(item.mime).toMatch(/^image\//)
      expect(item.hasDataUrl).toBeDefined()
      expect(item.hasDataUrl!.length).toBeGreaterThan(100)
    }
  })

  it('safely queries files by filename without UUID syntax error (Postgres 22P02 regression check)', async () => {
    const db = getDb()
    const testFilename = '8be25fba-a41c-4313-9e43-7b5da4857813-6216fcee.png'
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testFilename)
    expect(isUuid).toBe(false)

    const conditions = [
      eq(files.objectKey, testFilename),
      eq(files.name, testFilename),
    ]
    if (isUuid) conditions.push(eq(files.id, testFilename))

    const [row] = await db.select().from(files).where(or(...conditions)).limit(1)
    expect(row).toBeDefined()
    expect(row?.name).toBe(testFilename)
    expect(row?.mime).toBe('image/png')
  })

  it('validates image data binary buffer conversion and dimensions for active assets', async () => {
    const db = getDb()
    const activeFavicon = await db.select({
      dataUrl: files.dataUrl,
    }).from(brandAssets)
      .innerJoin(files, eq(brandAssets.fileId, files.id))
      .where(and(eq(brandAssets.slot, 'favicon'), eq(brandAssets.isActive, true)))
      .limit(1)

    expect(activeFavicon.length).toBe(1)
    const dataUrl = activeFavicon[0]!.dataUrl!
    const base64 = dataUrl.slice(dataUrl.indexOf(';base64,') + 8)
    const buf = Buffer.from(base64, 'base64')

    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(512)
    expect(meta.height).toBe(512)
  })
})
