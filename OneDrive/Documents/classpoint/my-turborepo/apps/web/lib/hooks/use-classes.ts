import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Class, PaginatedResponse } from '@/lib/types'

interface UseClassesOptions {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export function useClasses(options: UseClassesOptions = {}) {
  const { page = 1, limit = 10, search, isActive } = options

  return useQuery<PaginatedResponse<Class>>({
    queryKey: ['classes', { page, limit, search, isActive }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) {
        params.append('search', search)
      }
      if (isActive !== undefined) {
        params.append('isActive', isActive.toString())
      }
      return apiClient.get(`/classes?${params.toString()}`)
    },
  })
}

export function useClass(id: string | null) {
  return useQuery<Class>({
    queryKey: ['class', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Class ID is required')
      }
      return apiClient.get(`/classes/${id}`)
    },
    enabled: !!id,
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Class>) => apiClient.post('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useUpdateClass(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Class>) => apiClient.patch(`/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class', id] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
