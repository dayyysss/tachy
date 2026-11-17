import { describe, expect, it } from 'vitest'
import { userCreateSchema, userPatchSchema, adminSettingsSchema } from '#shared/schemas/admin'
import { seoSchema } from '#shared/schemas/seo'
import { hasPermission } from '#shared/config/roles'

describe('Admin User Schemas', () => {
  it('validates user creation payload properly', () => {
    const valid = userCreateSchema.safeParse({
      name: 'John Doe',
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
    })
    expect(valid.success).toBe(true)

    // Short password fails
    const invalidPass = userCreateSchema.safeParse({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'short',
    })
    expect(invalidPass.success).toBe(false)

    // Invalid email fails
    const invalidEmail = userCreateSchema.safeParse({
      username: 'john_doe',
      email: 'not-an-email',
      password: 'password123',
    })
    expect(invalidEmail.success).toBe(false)

    // Invalid username special chars fail
    const invalidUsername = userCreateSchema.safeParse({
      username: 'john@doe!',
      email: 'john@example.com',
      password: 'password123',
    })
    expect(invalidUsername.success).toBe(false)
  })

  it('validates user patch payload properly', () => {
    const valid = userPatchSchema.safeParse({
      name: 'Jane Doe',
      username: 'jane_updated',
      role: 'moderator',
      leaderboardBanned: true,
      isPublic: false,
      password: 'newpassword123',
    })
    expect(valid.success).toBe(true)

    const invalidRole = userPatchSchema.safeParse({
      role: 'superadmin',
    })
    expect(invalidRole.success).toBe(false)
  })

  it('verifies permissions per role', () => {
    expect(hasPermission('admin', 'anything')).toBe(true)
    expect(hasPermission('moderator', 'users:read')).toBe(true)
    expect(hasPermission('user', 'users:read')).toBe(false)
    expect(hasPermission('user', 'self:write')).toBe(true)
  })

  it('validates seo schema with dynamic website domain / siteUrl', () => {
    const parsed = seoSchema.parse({
      siteName: 'Tachy Speed',
      siteUrl: 'https://speedtyping.app',
    })
    expect(parsed.siteUrl).toBe('https://speedtyping.app')
    expect(parsed.siteName).toBe('Tachy Speed')

    // Default siteUrl is empty string
    const defaulted = seoSchema.parse({})
    expect(defaulted.siteUrl).toBe('')

    // Nested inside adminSettingsSchema
    const adminParsed = adminSettingsSchema.parse({
      seo: { siteUrl: 'https://custom.tachy.dev' },
    })
    expect(adminParsed.seo.siteUrl).toBe('https://custom.tachy.dev')
  })
})
