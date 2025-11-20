'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/lib/auth/auth-service'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const email = watch('email')

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await authService.resetPassword({ username: data.email })
      setSuccess(true)

      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(data.email)}`)
      }, 2000)
    } catch (err: any) {
      console.error('Forgot password error:', err)

      if (err.name === 'UserNotFoundException') {
        // Don't reveal if user exists or not for security
        setSuccess(true)
      } else if (err.name === 'LimitExceededException') {
        setError('Too many requests. Please try again later.')
      } else {
        setError(err.message || 'An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-gray-600">
          We've sent a password reset code to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Please check your inbox and follow the instructions to reset your password.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-gray-600">
          Enter your email address and we'll send you a code to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@school.com"
            {...register('email')}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending code...' : 'Send reset code'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          onClick={() => router.push('/auth/login')}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}
