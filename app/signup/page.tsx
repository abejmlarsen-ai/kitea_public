import type { Metadata } from 'next'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = { title: 'Sign Up' }

export default function SignupPage() {
  return (
    <div className="page-theme page-theme--signup">
      <SignupForm />
    </div>
  )
}
