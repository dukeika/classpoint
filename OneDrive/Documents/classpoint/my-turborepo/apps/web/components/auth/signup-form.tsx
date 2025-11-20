'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { authService } from '@/lib/auth/auth-service'

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  tenantId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

interface SignupFormProps {
  defaultTenantId?: string
  onSuccess?: () => void
}

export function SignupForm({ defaultTenantId, onSuccess }: SignupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      tenantId: defaultTenantId,
      role: 'TEACHER',
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create user in Cognito
      const result = await authService.signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId: data.tenantId || defaultTenantId,
        roles: data.role,
      })

      if (result.isSignUpComplete) {
        setSuccess(true)

        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        } else {
          // Redirect to verification page
          setTimeout(() => {
            router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
          }, 2000)
        }
      } else {
        // User needs to verify email
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
      }
    } catch (err: any) {
      console.error('Signup error:', err)

      // Handle specific Cognito errors
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists')
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements')
      } else if (err.name === 'InvalidParameterException') {
        setError('Invalid input. Please check all fields.')
      } else {
        setError(err.message || 'An error occurred during signup')
      }
    } finally {
      setIsLoading(false)
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
        <h2 className="text-2xl font-bold">Account Created!</h2>
        <p className="text-gray-600">
          Please check your email to verify your account before logging in.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
        <p className="text-gray-600">Register a new staff member</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              {...register('firstName')}
              disabled={isLoading}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              {...register('lastName')}
              disabled={isLoading}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@school.com"
            {...register('email')}
            disabled={isLoading}
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('role')}
            disabled={isLoading}
          >
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="HOUSEMASTER">Housemaster</option>
          </select>
          {errors.role && (
            <p className="text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            {...register('password')}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Must be 12+ characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
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
