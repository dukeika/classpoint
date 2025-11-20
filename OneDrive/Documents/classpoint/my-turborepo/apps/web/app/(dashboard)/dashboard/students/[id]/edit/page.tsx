'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { studentService } from '@/lib/api/students'
import Link from 'next/link'

// Validation schema
const studentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Gender is required',
  }),
  enrollmentStatus: z.enum(['ENROLLED', 'GRADUATED', 'WITHDRAWN'], {
    required_error: 'Enrollment status is required',
  }),
  householdId: z.string().optional(),
})

type StudentFormData = z.infer<typeof studentSchema>

export default function EditStudentPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <EditStudentContent />
    </AuthGuard>
  )
}

function EditStudentContent() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string>('')

  // Fetch student data
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['students', studentId],
    queryFn: () => studentService.getById(studentId),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  })

  // Pre-fill form when student data loads
  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || '',
        phone: student.phone || '',
        dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
        gender: student.gender,
        enrollmentStatus: student.enrollmentStatus,
        householdId: student.householdId || '',
      })
    }
  }, [student, reset])

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: (data: StudentFormData) => studentService.update(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students', studentId] })
      router.push(`/dashboard/students/${studentId}`)
    },
    onError: (error: Error) => {
      setApiError(error.message || 'Failed to update student')
    },
  })

  const onSubmit = async (data: StudentFormData) => {
    setApiError('')

    // Clean up empty optional fields
    const payload = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      householdId: data.householdId || undefined,
    }

    updateMutation.mutate(payload)
  }

  if (isLoadingStudent) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading student...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Student not found</p>
            <Link href="/dashboard/students">
              <Button className="mt-4" variant="outline">
                Back to Students
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Link href="/dashboard/students" className="hover:text-gray-900">
            Students
          </Link>
          <span>/</span>
          <Link href={`/dashboard/students/${studentId}`} className="hover:text-gray-900">
            {student.firstName} {student.lastName}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
        <p className="text-gray-600 mt-1">Update student information</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Update the student's details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Error */}
            {apiError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{apiError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="gender"
                    {...register('gender')}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="student@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Enrollment Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Enrollment
              </h3>

              <div className="space-y-2">
                <Label htmlFor="enrollmentStatus">
                  Enrollment Status <span className="text-red-500">*</span>
                </Label>
                <select
                  id="enrollmentStatus"
                  {...register('enrollmentStatus')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="ENROLLED">Enrolled</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
                {errors.enrollmentStatus && (
                  <p className="text-sm text-red-600">{errors.enrollmentStatus.message}</p>
                )}
              </div>
            </div>

            {/* Household Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Household (Optional)
              </h3>

              <div className="space-y-2">
                <Label htmlFor="householdId">Household ID</Label>
                <Input
                  id="householdId"
                  {...register('householdId')}
                  placeholder="Enter household ID if applicable"
                />
                <p className="text-xs text-gray-500">
                  Leave blank to remove from household
                </p>
                {errors.householdId && (
                  <p className="text-sm text-red-600">{errors.householdId.message}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Link href={`/dashboard/students/${studentId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
                {isSubmitting || updateMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Updating...
                  </>
                ) : (
                  'Update Student'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
