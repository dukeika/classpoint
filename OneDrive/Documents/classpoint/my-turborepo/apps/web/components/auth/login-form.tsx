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
import { useAuthStore } from '@/lib/stores/auth-store'
import type { User } from '@/lib/types'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Sign in with Cognito
      const { user: cognitoUser, session } = await authService.login({
        email: data.email,
        password: data.password,
      })

      if (cognitoUser && session) {
        // Get user attributes from ID token
        const attributes = await authService.getUserAttributes()
        const idToken = await authService.getIdToken()

        if (attributes && idToken) {
          // Create user object for store
          const user: User = {
            id: attributes.sub,
            email: attributes.email,
            firstName: attributes.given_name || '',
            lastName: attributes.family_name || '',
            role: attributes['custom:roles'] || 'ADMIN',
            tenantId: attributes['custom:tenant_id'] || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          // Store user and token
          login(user, idToken)

          // Redirect to dashboard
          router.push(redirectTo)
        } else {
          setError('Failed to retrieve user information')
        }
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (err: any) {
      console.error('Login error:', err)

      // Handle specific Cognito errors
      if (err.name === 'UserNotFoundException' || err.name === 'NotAuthorizedException') {
        setError('Invalid email or password')
      } else if (err.name === 'UserNotConfirmedException') {
        setError('Please verify your email address before logging in')
      } else if (err.name === 'PasswordResetRequiredException') {
        setError('Password reset required. Please contact your administrator.')
      } else {
        setError(err.message || 'An error occurred during login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-gray-600">Enter your credentials to access your account</p>
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
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              onClick={() => router.push('/auth/forgot-password')}
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            {...register('password')}
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          onClick={() => router.push('/auth/signup')}
        >
          Contact your administrator
        </button>
      </div>
    </div>
  )
}
