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

const resetPasswordSchema = z
  .object({
    code: z.string().min(6, 'Verification code must be at least 6 characters'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) {
      setError('Email is required. Please start the password reset process again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await authService.confirmResetPassword({
        username: email,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      })

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      console.error('Reset password error:', err)

      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please check and try again.')
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.')
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements.')
      } else if (err.name === 'LimitExceededException') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(err.message || 'An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) return

    try {
      await authService.resetPassword({ username: email })
      alert('New code sent to your email!')
    } catch (err) {
      console.error('Resend code error:', err)
      alert('Failed to resend code. Please try again.')
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
        <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
        <p className="text-gray-600">
          Your password has been reset. You can now log in with your new password.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
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
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            onClick={handleResendCode}
          >
            Didn't receive a code? Resend
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••••••"
            {...register('newPassword')}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.newPassword && (
            <p className="text-sm text-red-600">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Must be 12+ characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••••••"
            {...register('confirmPassword')}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Resetting password...' : 'Reset Password'}
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
