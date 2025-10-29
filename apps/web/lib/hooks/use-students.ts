import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Student, PaginatedResponse } from '@/lib/types'

interface UseStudentsOptions {
  page?: number
  limit?: number
  search?: string
}

export function useStudents(options: UseStudentsOptions = {}) {
  const { page = 1, limit = 10, search } = options

  return useQuery<PaginatedResponse<Student>>({
    queryKey: ['students', { page, limit, search }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) {
        params.append('search', search)
      }
      return apiClient.get(`/students?${params.toString()}`)
    },
  })
}

export function useStudent(id: string | null) {
  return useQuery<Student>({
    queryKey: ['student', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Student ID is required')
      }
      return apiClient.get(`/students/${id}`)
    },
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Student>) => apiClient.post('/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Student>) => apiClient.patch(`/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
