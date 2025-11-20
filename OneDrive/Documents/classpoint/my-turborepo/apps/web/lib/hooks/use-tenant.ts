import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Tenant } from '@/lib/types'

export function useTenantBySlug(slug: string | null) {
  return useQuery<Tenant>({
    queryKey: ['tenant', 'slug', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('Slug is required')
      }
      return apiClient.get(`/tenants/by-slug/${slug}`)
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

export function useTenantById(id: string | null) {
  return useQuery<Tenant>({
    queryKey: ['tenant', 'id', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('ID is required')
      }
      return apiClient.get(`/tenants/${id}`)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

export function useTenants() {
  return useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => apiClient.get('/tenants'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
