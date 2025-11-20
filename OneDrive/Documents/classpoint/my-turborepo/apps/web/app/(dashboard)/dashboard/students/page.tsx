'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { studentService, type GetStudentsParams } from '@/lib/api/students'
import Link from 'next/link'

export default function StudentsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <StudentsContent />
    </AuthGuard>
  )
}

function StudentsContent() {
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('')
  const [enrollmentStatus, setEnrollmentStatus] = useState<'ENROLLED' | 'GRADUATED' | 'WITHDRAWN' | ''>('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Build query params
  const params: GetStudentsParams = {
    page,
    limit,
    ...(search && { search }),
    ...(gender && { gender }),
    ...(enrollmentStatus && { enrollmentStatus }),
  }

  // Fetch students
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.getAll(params),
  })

  const students = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page on search
  }

  // Handle filter change
  const handleFilterChange = () => {
    setPage(1) // Reset to first page on filter change
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage your school students</p>
        </div>
        <Link href="/dashboard/students/new">
          <Button>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Student
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Gender filter */}
            <div>
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as any)
                  handleFilterChange()
                }}
              >
                <option value="">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Status filter */}
            <div>
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={enrollmentStatus}
                onChange={(e) => {
                  setEnrollmentStatus(e.target.value as any)
                  handleFilterChange()
                }}
              >
                <option value="">All Statuses</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="GRADUATED">Graduated</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student List</CardTitle>
              <CardDescription>
                Showing {students.length} of {total} students
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          )}

          {isError && (
            <div className="text-center py-8 text-red-600">
              <svg
                className="h-12 w-12 mx-auto mb-4"
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
              <p className="font-semibold">Error loading students</p>
              <p className="text-sm text-gray-600 mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          )}

          {!isLoading && !isError && students.length === 0 && (
            <div className="text-center py-8 text-gray-500">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p>No students found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || gender || enrollmentStatus
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first student'}
              </p>
            </div>
          )}

          {!isLoading && !isError && students.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.email || '—'}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(student.enrollmentStatus)}>
                          {student.enrollmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/dashboard/students/${student.id}`}>
                            <Button variant="ghost" size="sm">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Button>
                          </Link>
                          <Link href={`/dashboard/students/${student.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <svg
                                className="h-4 w-4"
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
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
