/**
 * Teacher React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  Teacher,
  CreateTeacherDto,
  UpdateTeacherDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useTeachers(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.teachers.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<Teacher>>(apiEndpoints.teachers.list),
  });
}

export function useTeacher(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teachers.detail(id),
    queryFn: () => apiClient.get<Teacher>(apiEndpoints.teachers.get(id)),
    enabled: !!id && enabled,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTeacherDto) =>
      apiClient.post<Teacher>(apiEndpoints.teachers.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
      toast({ title: 'Success', description: 'Teacher created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherDto }) =>
      apiClient.patch<Teacher>(apiEndpoints.teachers.update(id), data),
    onSuccess: (updatedTeacher) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.detail(updatedTeacher.id) });
      toast({ title: 'Success', description: 'Teacher updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.teachers.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
      toast({ title: 'Success', description: 'Teacher deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
