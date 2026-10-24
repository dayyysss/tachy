import { and, eq, max } from 'drizzle-orm'
import { brandSlots } from '#shared/config/brand'
import { brandAssets, files } from '../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const slot = String(getRouterParam(event, 'slot') ?? '')
  const definition = brandSlots.find(item => item.id === slot)
  if (!definition) throw createError({ statusCode: 404, statusMessage: 'Unknown brand slot' })

  const body = await readBody(event)
  const fileId = typeof body?.fileId === 'string' ? body.fileId : ''
  if (!fileId) throw createError({ statusCode: 400, statusMessage: 'fileId is required' })

  const db = getDb()
  const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1)
  if (!file) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  const extension = file.mime.split('/').pop()?.replace('jpeg', 'jpg')
  if (!definition.formats.includes(extension ?? '')) {
    throw createError({ statusCode: 415, statusMessage: `Use ${definition.formats.join(', ')} for this slot` })
  }
  if (definition.minWidth && (file.width ?? 0) < definition.minWidth) {
    throw createError({ statusCode: 422, statusMessage: `Minimum width is ${definition.minWidth}px` })
  }
  if (definition.minHeight && (file.height ?? 0) < definition.minHeight) {
    throw createError({ statusCode: 422, statusMessage: `Minimum height is ${definition.minHeight}px` })
  }

  const [current] = await db.select({ version: max(brandAssets.version) }).from(brandAssets).where(eq(brandAssets.slot, slot))
  const version = (current?.version ?? 0) + 1

  await db.transaction(async tx => {
    await tx.update(brandAssets).set({ isActive: false }).where(and(eq(brandAssets.slot, slot), eq(brandAssets.isActive, true)))
    await tx.insert(brandAssets).values({
      slot,
      version,
      fileId,
      isActive: true,
      createdBy: admin.id,
    })
  })

  await writeAudit(event, admin, 'brand.publish', 'brand_slot', slot, null, { fileId, version })
  return { ok: true, version }
})
