import { Suspense } from 'react'
import { VerifyEmailForm } from '@/components/auth/verify-email-form'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}
