import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep app bootable in local rebuild mode while making the configuration issue explicit.
  console.error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl || 'https://invalid.local', supabaseAnonKey || 'invalid-key')
