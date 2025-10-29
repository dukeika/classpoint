import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Assignment, PaginatedResponse } from '@/lib/types'

interface UseAssignmentsOptions {
  page?: number
  limit?: number
  classId?: string
  status?: string
}

export function useAssignments(options: UseAssignmentsOptions = {}) {
  const { page = 1, limit = 10, classId, status } = options

  return useQuery<PaginatedResponse<Assignment>>({
    queryKey: ['assignments', { page, limit, classId, status }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (classId) {
        params.append('classId', classId)
      }
      if (status) {
        params.append('status', status)
      }
      return apiClient.get(`/assignments?${params.toString()}`)
    },
  })
}

export function useAssignment(id: string | null) {
  return useQuery<Assignment>({
    queryKey: ['assignment', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Assignment ID is required')
      }
      return apiClient.get(`/assignments/${id}`)
    },
    enabled: !!id,
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Assignment>) =>
      apiClient.post('/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useUpdateAssignment(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Assignment>) =>
      apiClient.patch(`/assignments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['assignment', id] })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}
