import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export interface TestTokenPayload {
  testId: string
  userId: string | null
  configKey: string
  seed: string
  issuedAt: number
}

function secret(): string {
  return process.env.TEST_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET || 'tachy-dev-secret-change-me'
}

export function signTestToken(payload: Omit<TestTokenPayload, 'testId'> & { testId?: string }): { token: string; payload: TestTokenPayload } {
  const full: TestTokenPayload = { ...payload, testId: payload.testId ?? randomUUID() }
  const body = Buffer.from(JSON.stringify(full)).toString('base64url')
  const signature = createHmac('sha256', secret()).update(body).digest('base64url')
  return { token: `${body}.${signature}`, payload: full }
}

export function verifyTestToken(token: string, maxAgeMs = 35 * 60 * 1000): TestTokenPayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TestTokenPayload
    if (!payload.testId || !payload.configKey || !payload.seed) return null
    if (Date.now() - payload.issuedAt > maxAgeMs) return null
    return payload
  } catch {
    return null
  }
}
