import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function storageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getStorage(): SupabaseClient | null {
  if (!storageConfigured()) return null
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

export function publicFileUrl(bucket: string, objectKey: string): string | null {
  const supabase = getStorage()
  if (!supabase) return null
  if (bucket === 'private') return null
  return supabase.storage.from(bucket).getPublicUrl(objectKey).data.publicUrl
}
