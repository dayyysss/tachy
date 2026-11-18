import { z } from 'zod'

export const socialSchema = z.object({
  email: z.string().max(120).default('support@tachy.app'),
  github: z.string().max(250).default('https://github.com/dayyysss/tachy'),
  discord: z.string().max(250).default('https://discord.gg'),
  twitter: z.string().max(250).default('https://x.com'),
  bluesky: z.string().max(250).default(''),
  youtube: z.string().max(250).default(''),
})

export type SocialConfig = z.infer<typeof socialSchema>
