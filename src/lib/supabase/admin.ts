import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

/**
 * Service-role client — bypasses RLS. Server-only, never import in client code.
 * Optional: core flows run on RLS alone; this exists for maintenance tasks.
 */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  if (!adminClient) {
    adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return adminClient
}
