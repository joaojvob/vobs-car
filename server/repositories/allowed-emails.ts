import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'

export async function isEmailAllowed(db: SupabaseClient<Database>, email: string): Promise<boolean> {
  const { data, error } = await db
    .from('allowed_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data !== null
}
