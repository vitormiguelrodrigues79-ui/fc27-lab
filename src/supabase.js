import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://boyhtywhuumbayejfbse.supabase.co',
  'sb_publishable_U3BQ__QzzsBOSq6w_2LGew_GczKnjhO',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)
