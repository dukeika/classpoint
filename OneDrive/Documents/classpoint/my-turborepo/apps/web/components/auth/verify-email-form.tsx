'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/lib/auth/auth-service'

const verifyEmailSchema = z.object({
  code: z.string().min(6, 'Verification code must be at least 6 characters'),
})

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>

export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  })

  const onSubmit = async (data: VerifyEmailFormData) => {
    if (!email) {
      setError('Email is required. Please start the signup process again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await authService.confirmSignup({
        username: email,
        confirmationCode: data.code,
      })

      if (result.isSignUpComplete) {
        setSuccess(true)

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Verify email error:', err)

      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please check and try again.')
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.')
      } else if (err.name === 'NotAuthorizedException') {
        setError('User is already confirmed.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(err.message || 'An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) return

    setResending(true)
    try {
      await authService.resendConfirmationCode(email)
      alert('New verification code sent to your email!')
    } catch (err: any) {
      console.error('Resend code error:', err)
      if (err.name === 'LimitExceededException') {
        alert('Too many requests. Please try again later.')
      } else {
        alert('Failed to resend code. Please try again.')
      }
    } finally {
      setResending(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Email Verified!</h2>
        <p className="text-gray-600">
          Your email has been verified successfully. You can now log in to your account.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Verify Email</h1>
        <p className="text-gray-600">
          Enter the verification code sent to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="123456"
            {...register('code')}
            disabled={isLoading}
            autoComplete="one-time-code"
            autoFocus
          />
          {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            onClick={handleResendCode}
            disabled={resending}
          >
            {resending ? 'Sending...' : "Didn't receive a code? Resend"}
          </button>
        </div>
      </form>

      <div className="text-center text-sm text-gray-600">
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          onClick={() => router.push('/auth/login')}
        >
          Back to login
        </button>
      </div>
    </div>
  )
}
