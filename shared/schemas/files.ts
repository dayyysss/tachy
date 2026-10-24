import { z } from 'zod'

export const filesQuerySchema = z.object({
  folder: z.string().max(256).default('/'),
  q: z.string().max(100).default(''),
  type: z.string().max(50).default(''),
  cursor: z.string().max(256).optional(),
})

export const uploadUrlSchema = z.object({
  name: z.string().min(1).max(255),
  folder: z.string().max(256).default('/'),
  mime: z.string().min(3).max(100),
  size: z.number().int().positive(),
})

export const confirmUploadSchema = z.object({
  fileId: z.string().uuid(),
  objectKey: z.string().min(1).max(512),
  bucket: z.enum(['public', 'private']).default('public'),
  name: z.string().min(1).max(255),
  folder: z.string().max(256).default('/'),
})

export const folderSchema = z.object({
  path: z.string().min(1).max(256).regex(/^\/[a-zA-Z0-9/_-]*$/),
})

export type FilesQuery = z.infer<typeof filesQuerySchema>
