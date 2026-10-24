import { randomUUID } from 'node:crypto'
import { startTestSchema } from '#shared/schemas/test'
import { configKeyFromTest } from '#shared/utils/keys'
import { testTokens } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const parsed = startTestSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid config' })

  const config = parsed.data.config
  const user = await getSessionUser(event)
  const seed = parsed.data.seed ?? randomUUID()
  const issuedAt = Date.now()
  const configKey = configKeyFromTest(config)
  const { token, payload } = signTestToken({
    userId: user?.id ?? null,
    configKey,
    seed,
    issuedAt,
  })

  if (hasDatabase()) {
    try {
      await getDb().insert(testTokens).values({
        id: payload.testId,
        userId: user?.id ?? null,
        configKey,
        seed,
        expiresAt: new Date(issuedAt + 35 * 60 * 1000),
      })
    } catch {
      // token remains valid via signature even if the bookkeeping insert fails
    }
  }

  return { testId: payload.testId, seed, token, issuedAt }
})
