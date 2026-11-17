import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../server/db'
import { brandAssets, files, folders } from '../server/db/schema/settings'
import { user } from '../server/db/schema/auth'

async function seedBrand() {
  console.log('Seeding brand assets into database...')
  const db = getDb()

  // Find admin user to attribute upload
  const [admin] = await db.select({ id: user.id }).from(user).where(eq(user.role, 'admin')).limit(1)
  const adminId = admin?.id || null

  // Ensure /brand folder exists
  await db.insert(folders).values({ path: '/brand', createdBy: adminId }).onConflictDoNothing()

  const assetsToSeed: Array<{
    slot: string
    name: string
    fileRelPath: string
    mime: string
  }> = [
    {
      slot: 'logo-on-light',
      name: 'tachy-logo-light.png',
      fileRelPath: 'public/brand/logo-on-light.png',
      mime: 'image/png',
    },
    {
      slot: 'logo-on-dark',
      name: 'tachy-logo-dark.png',
      fileRelPath: 'public/brand/logo-on-dark.png',
      mime: 'image/png',
    },
    {
      slot: 'logo-mark',
      name: 'tachy-mark.png',
      fileRelPath: 'public/favicon.png',
      mime: 'image/png',
    },
    {
      slot: 'favicon',
      name: 'tachy-favicon.png',
      fileRelPath: 'public/favicon.png',
      mime: 'image/png',
    },
    {
      slot: 'og-default',
      name: 'tachy-og-card.png',
      fileRelPath: 'public/brand/og-default.png',
      mime: 'image/png',
    },
  ]

  for (const item of assetsToSeed) {
    const fullPath = path.resolve(process.cwd(), item.fileRelPath)
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`)
      continue
    }

    const buffer = fs.readFileSync(fullPath)
    let width: number | null = null
    let height: number | null = null
    try {
      const meta = await sharp(buffer).metadata()
      width = meta.width ?? null
      height = meta.height ?? null
    } catch {}

    const checksum = createHash('sha256').update(buffer).digest('hex')
    const fileId = randomUUID()
    const objectKey = `brand_${item.slot}_${Date.now()}.png`
    const dataUrl = `data:${item.mime};base64,${buffer.toString('base64')}`

    // Check if slot already has an active brand asset in DB
    const [existing] = await db.select().from(brandAssets).where(
      and(eq(brandAssets.slot, item.slot), eq(brandAssets.isActive, true))
    ).limit(1)

    if (existing) {
      console.log(`Slot '${item.slot}' already has active asset (version ${existing.version}). Skipping.`)
      continue
    }

    // Insert into files
    const [fileRow] = await db.insert(files).values({
      id: fileId,
      bucket: 'public',
      objectKey,
      folder: '/brand',
      name: item.name,
      mime: item.mime,
      sizeBytes: buffer.length,
      width,
      height,
      checksum,
      dataUrl,
      uploadedBy: adminId,
    }).returning()

    // Insert into brandAssets
    await db.insert(brandAssets).values({
      slot: item.slot,
      version: 1,
      fileId: fileRow!.id,
      isActive: true,
      createdBy: adminId,
    })

    console.log(`✓ Seeded brand slot '${item.slot}' -> ${item.name} (${width}x${height})`)
  }

  console.log('Brand asset seeding completed successfully!')
  process.exit(0)
}

seedBrand().catch(err => {
  console.error('Seeding brand failed:', err)
  process.exit(1)
})
