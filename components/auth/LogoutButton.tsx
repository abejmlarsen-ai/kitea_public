'use client'
// ─── Logout Button (Client Component) ────────────────────────────────────────

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button id="logout-btn" onClick={handleLogout}>
      Logout
    </button>
  )
}
