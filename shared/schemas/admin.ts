import { z } from 'zod'
import { roles } from '#shared/config/roles'
import { seoSchema } from './seo'

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
  role: z.enum(roles).optional(),
  leaderboardBanned: z.boolean().optional(),
})

export const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
  note: z.string().max(500).optional(),
})

export const adminSettingsSchema = z.object({
  flags: z.object({
    maintenance: z.boolean().default(false),
    signups: z.boolean().default(true),
    leaderboards: z.boolean().default(true),
    dailyChallenge: z.boolean().default(true),
  }),
  announcement: z.object({
    enabled: z.boolean().default(false),
    text: z.string().max(280).default(''),
    type: z.enum(['info', 'warning']).default('info'),
    expiresAt: z.string().datetime().nullable().default(null),
  }).nullable().default(null),
  seo: seoSchema,
})

export type AdminSettings = z.infer<typeof adminSettingsSchema>
