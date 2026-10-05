'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  // Defaults render the desktop header button (#logout-btn). Other placements
  // (e.g. the mobile menu) pass their own class and label, and get no id so the
  // two buttons never share one.
  className?: string
  label?: string
}

export default function LogoutButton({ className, label = 'Logout' }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      id={className ? undefined : 'logout-btn'}
      className={className ?? 'nav-logout-btn'}
      onClick={handleLogout}
    >
      {label}
    </button>
  )
}
