import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

// Expose the client on window for quick browser debugging in development only
try {
  if (import.meta.env.DEV && typeof window !== 'undefined' && supabase) {
    // Non-blocking, useful for debugging in DevTools: use `window.__supabase`
    window.__supabase = supabase
  }
} catch (e) {
  // ignore in non-browser environments
}
