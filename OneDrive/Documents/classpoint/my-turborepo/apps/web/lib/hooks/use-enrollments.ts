import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Enrollment, PaginatedResponse } from '@/lib/types'

interface UseEnrollmentsOptions {
  page?: number
  limit?: number
  studentId?: string
  classId?: string
  status?: string
}

export function useEnrollments(options: UseEnrollmentsOptions = {}) {
  const { page = 1, limit = 10, studentId, classId, status } = options

  return useQuery<PaginatedResponse<Enrollment>>({
    queryKey: ['enrollments', { page, limit, studentId, classId, status }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (studentId) {
        params.append('studentId', studentId)
      }
      if (classId) {
        params.append('classId', classId)
      }
      if (status) {
        params.append('status', status)
      }
      return apiClient.get(`/enrollments?${params.toString()}`)
    },
  })
}

export function useEnrollment(id: string | null) {
  return useQuery<Enrollment>({
    queryKey: ['enrollment', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Enrollment ID is required')
      }
      return apiClient.get(`/enrollments/${id}`)
    },
    enabled: !!id,
  })
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Enrollment>) =>
      apiClient.post('/enrollments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useUpdateEnrollment(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Enrollment>) =>
      apiClient.patch(`/enrollments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] })
    },
  })
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/enrollments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
  })
}
