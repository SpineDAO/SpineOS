import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Database operations will fail.')
}

// Service role client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Create a client scoped to a user's JWT for RLS-aware queries
export function supabaseForUser(accessToken) {
  if (!supabaseUrl) return null
  const anonKey = process.env.SUPABASE_ANON_KEY || supabaseServiceKey
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
