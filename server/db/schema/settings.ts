import { pgTable, uuid, text, integer, bigint, boolean, timestamp, jsonb, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const files = pgTable('files', {
  id: uuid('id').primaryKey(),
  bucket: text('bucket').notNull().default('public'),
  objectKey: text('object_key').notNull(),
  folder: text('folder').notNull().default('/'),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  checksum: text('checksum'),
  dataUrl: text('data_url'),
  uploadedBy: text('uploaded_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, table => [
  uniqueIndex('files_bucket_key_idx').on(table.bucket, table.objectKey),
  index('files_folder_idx').on(table.folder),
])

export const folders = pgTable('folders', {
  path: text('path').primaryKey(),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const brandAssets = pgTable('brand_assets', {
  slot: text('slot').notNull(),
  version: integer('version').notNull(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').notNull().default(false),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.slot, table.version] })])

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: text('updated_by').references(() => user.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: text('actor_id'),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('audit_created_idx').on(table.createdAt),
  index('audit_actor_idx').on(table.actorId),
])
