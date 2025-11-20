/**
 * Fee Status React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  FeeStatus,
  CreateFeeStatusDto,
  UpdateFeeStatusDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useFeeStatuses(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.feeStatus.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<FeeStatus>>(apiEndpoints.feeStatus.list),
  });
}

export function useFeeStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.feeStatus.detail(id),
    queryFn: () => apiClient.get<FeeStatus>(apiEndpoints.feeStatus.get(id)),
    enabled: !!id && enabled,
  });
}

export function useFeeStatusByStudent(studentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.feeStatus.byStudent(studentId),
    queryFn: () => apiClient.get<FeeStatus[]>(apiEndpoints.feeStatus.byStudent(studentId)),
    enabled: !!studentId && enabled,
  });
}

export function useCreateFeeStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateFeeStatusDto) =>
      apiClient.post<FeeStatus>(apiEndpoints.feeStatus.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeStatus.all });
      toast({ title: 'Success', description: 'Fee status created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateFeeStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeeStatusDto }) =>
      apiClient.patch<FeeStatus>(apiEndpoints.feeStatus.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeStatus.all });
      toast({ title: 'Success', description: 'Fee status updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFeeStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.feeStatus.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeStatus.all });
      toast({ title: 'Success', description: 'Fee status deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
