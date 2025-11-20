/**
 * Household React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  Household,
  CreateHouseholdDto,
  UpdateHouseholdDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useHouseholds(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.households.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<Household>>(apiEndpoints.households.list),
  });
}

export function useHousehold(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.households.detail(id),
    queryFn: () => apiClient.get<Household>(apiEndpoints.households.get(id)),
    enabled: !!id && enabled,
  });
}

export function useHouseholdsByParent(parentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.households.byParent(parentId),
    queryFn: () => apiClient.get<Household[]>(apiEndpoints.households.byParent(parentId)),
    enabled: !!parentId && enabled,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateHouseholdDto) =>
      apiClient.post<Household>(apiEndpoints.households.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.all });
      toast({ title: 'Success', description: 'Household created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateHousehold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHouseholdDto }) =>
      apiClient.patch<Household>(apiEndpoints.households.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.all });
      toast({ title: 'Success', description: 'Household updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.households.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.all });
      toast({ title: 'Success', description: 'Household deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
