import { z } from 'zod'

export const seoSchema = z.object({
  siteName: z.string().min(1).max(60).default('Tachy'),
  tagline: z.string().max(120).default('Type. Measure. Improve.'),
  titleTemplate: z.string().max(80).default('%s · Tachy'),
  defaultDescription: z.string().max(200).default('Free typing test with progress tracking.'),
  twitterHandle: z.string().max(40).default(''),
  ogImageFileId: z.string().uuid().nullable().default(null),
  defaultRobots: z.string().max(60).default('index,follow'),
  verification: z.object({
    google: z.string().max(200).default(''),
    bing: z.string().max(200).default(''),
  }).prefault({}),
})

export type SeoConfig = z.infer<typeof seoSchema>

