import { and, eq } from 'drizzle-orm'
import { brandAssets } from '../../../../db/schema/settings'
import { getDb, hasDatabase } from '../../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const slot = String(getRouterParam(event, 'slot') ?? '')
  const version = Number((await readBody(event))?.version)
  if (!slot || !Number.isFinite(version)) throw createError({ statusCode: 400, statusMessage: 'Invalid rollback' })

  const db = getDb()
  const [target] = await db.select().from(brandAssets).where(and(
    eq(brandAssets.slot, slot),
    eq(brandAssets.version, version),
  )).limit(1)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Version not found' })

  await db.transaction(async tx => {
    await tx.update(brandAssets).set({ isActive: false }).where(and(eq(brandAssets.slot, slot), eq(brandAssets.isActive, true)))
    await tx.update(brandAssets).set({ isActive: true }).where(and(
      eq(brandAssets.slot, slot),
      eq(brandAssets.version, version),
    ))
  })

  await writeAudit(event, admin, 'brand.rollback', 'brand_slot', slot, null, { version })
  return { ok: true }
})
