// ─── Library Page (Protected) ────────────────────────────────────────────────
// Middleware redirects unauthenticated users to /login before this renders.

import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'

export const metadata: Metadata = { title: 'Library' }

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch first name for personalised greeting
  let firstName = 'there'
  if (user) {
    const result = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .maybeSingle()

    const profile = result.data as { first_name?: string } | null
    firstName =
      profile?.first_name ??
      (user.user_metadata?.first_name as string | undefined) ??
      'there'
  }

  return (
    <>
      <section className="logo-hero logo-hero--home">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--home">
        <div className="container">
          <p id="user-greeting">Welcome back, {firstName}!</p>
          <h2>Library</h2>
          <p>Your NFT collection will appear here.</p>
        </div>
        <LogoutButton />
      </section>
    </>
  )
}
