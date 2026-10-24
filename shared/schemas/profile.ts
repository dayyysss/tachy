import { z } from 'zod'

export const usernameSchema = z.string().min(3).max(24).regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, _ and - only')
export const displayNameSchema = z.string().min(1).max(48)

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema.optional(),
  isPublic: z.boolean().default(true),
  timezone: z.string().max(64).default('UTC'),
})

export type ProfileInput = z.infer<typeof profileSchema>
