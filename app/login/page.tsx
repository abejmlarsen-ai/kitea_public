import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Login' }

export default function LoginPage() {
  return (
    <div className="page-theme page-theme--login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
