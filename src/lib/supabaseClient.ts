import { createClient } from '@supabase/supabase-js'

// Browser client. Uses the publishable key only (safe to ship in the bundle --
// RLS is what actually protects the data, see supabase/schema.sql). Used for
// Supabase Auth (sign up / sign in) in the M11 registration path. Data reads
// and writes go through api/*.ts, not this client directly.

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set.')
}

export const supabase = createClient(url, publishableKey)
