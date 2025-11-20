'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { studentService } from '@/lib/api/students'
import Link from 'next/link'

export default function StudentDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <StudentDetailContent />
    </AuthGuard>
  )
}

function StudentDetailContent() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch student data
  const { data: student, isLoading } = useQuery({
    queryKey: ['students', studentId],
    queryFn: () => studentService.getById(studentId),
  })

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: () => studentService.delete(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      router.push('/dashboard/students')
    },
  })

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'success'
      case 'GRADUATED':
        return 'info'
      case 'WITHDRAWN':
        return 'danger'
      default:
        return 'default'
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  if (isLoading) {
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
            <svg
              className="h-12 w-12 mx-auto text-gray-400 mb-4"
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
            <p className="text-red-600 font-semibold">Student not found</p>
            <p className="text-sm text-gray-600 mt-1">The student you're looking for doesn't exist</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard/students" className="hover:text-gray-900">
              Students
            </Link>
            <span>/</span>
            <span className="text-gray-900">
              {student.firstName} {student.lastName}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <Badge variant={getStatusVariant(student.enrollmentStatus)}>
              {student.enrollmentStatus}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/students/${studentId}/edit`}>
            <Button variant="outline">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Student</CardTitle>
              <CardDescription>
                Are you sure you want to delete this student? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">First Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{student.firstName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Last Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{student.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(student.dateOfBirth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900">{student.gender}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {student.email ? (
                      <a
                        href={`mailto:${student.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {student.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {student.phone ? (
                      <a
                        href={`tel:${student.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {student.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Enrollment Status</dt>
                  <dd className="mt-1">
                    <Badge variant={getStatusVariant(student.enrollmentStatus)}>
                      {student.enrollmentStatus}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Student ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{student.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Registered</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(student.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(student.updatedAt)}
                </div>
              </div>
              {student.householdId && (
                <div>
                  <div className="text-sm text-gray-600">Household</div>
                  <div className="text-sm font-medium text-gray-900">
                    <Link
                      href={`/dashboard/households/${student.householdId}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Household
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/attendance?studentId=${studentId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View Attendance
                </Button>
              </Link>
              <Link href={`/dashboard/enrollments?studentId=${studentId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  View Enrollments
                </Button>
              </Link>
              <Link href={`/dashboard/assessments?studentId=${studentId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View Assessments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
