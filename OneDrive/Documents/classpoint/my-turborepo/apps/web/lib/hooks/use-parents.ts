/**
 * Parent React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  Parent,
  CreateParentDto,
  UpdateParentDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useParents(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.parents.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<Parent>>(apiEndpoints.parents.list),
  });
}

export function useParent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.parents.detail(id),
    queryFn: () => apiClient.get<Parent>(apiEndpoints.parents.get(id)),
    enabled: !!id && enabled,
  });
}

export function useCreateParent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateParentDto) =>
      apiClient.post<Parent>(apiEndpoints.parents.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parents.lists() });
      toast({ title: 'Success', description: 'Parent created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateParent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateParentDto }) =>
      apiClient.patch<Parent>(apiEndpoints.parents.update(id), data),
    onSuccess: (updatedParent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parents.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.parents.detail(updatedParent.id) });
      toast({ title: 'Success', description: 'Parent updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteParent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.parents.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parents.lists() });
      toast({ title: 'Success', description: 'Parent deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
