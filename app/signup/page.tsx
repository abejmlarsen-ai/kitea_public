import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = { title: 'Sign Up' }

export default function SignupPage() {
  return (
    <div className="page-theme page-theme--signup">
      {/* SignupForm reads ?redirect via useSearchParams, which needs Suspense */}
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  )
}
