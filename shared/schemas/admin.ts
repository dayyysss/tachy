import { z } from 'zod'
import { roles } from '#shared/config/roles'
import { seoSchema } from './seo'
import { socialSchema } from './social'

export const adminUsersQuerySchema = z.object({
  q: z.string().max(100).default(''),
  role: z.string().max(20).default(''),
  banned: z.enum(['', 'true', 'false']).default(''),
  page: z.coerce.number().int().min(1).default(1),
})

export const banSchema = z.object({
  reason: z.string().min(3).max(300),
  expiresAt: z.string().datetime().optional(),
})

export const userPatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(roles).optional(),
  leaderboardBanned: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
})

export const userCreateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(roles).default('user'),
})

export const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
  note: z.string().max(500).optional(),
})

const defaultFlags = {
  maintenance: false,
  signups: true,
  leaderboards: true,
  dailyChallenge: true,
}

export const adminSettingsSchema = z.object({
  flags: z.object({
    maintenance: z.boolean().default(false),
    signups: z.boolean().default(true),
    leaderboards: z.boolean().default(true),
    dailyChallenge: z.boolean().default(true),
  }).default(defaultFlags),
  announcement: z.object({
    enabled: z.boolean().default(false),
    text: z.string().max(280).default(''),
    type: z.enum(['info', 'warning']).default('info'),
    expiresAt: z.preprocess(
      val => {
        if (!val || typeof val !== 'string' || !val.trim()) return null
        try {
          return new Date(val).toISOString()
        } catch {
          return val
        }
      },
      z.string().datetime().nullable(),
    ).default(null),
  }).nullable().default(null),
  seo: seoSchema.default(() => seoSchema.parse({})),
  social: socialSchema.default(() => socialSchema.parse({})),
})

export type AdminSettings = z.infer<typeof adminSettingsSchema>
