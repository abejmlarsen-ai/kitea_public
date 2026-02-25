// ─── Browser Supabase client ──────────────────────────────────────────────────
// Use in Client Components ('use client') only.
// Keys are NEXT_PUBLIC_* so they are safe to expose in the browser.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
