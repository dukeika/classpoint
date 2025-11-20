/**
 * Student React Query Hooks
 * Type-safe hooks for student data management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

/**
 * Fetch list of students
 */
export function useStudents(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.students.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<Student>>(apiEndpoints.students.list),
  });
}

/**
 * Fetch single student by ID
 */
export function useStudent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: () => apiClient.get<Student>(apiEndpoints.students.get(id)),
    enabled: !!id && enabled,
  });
}

/**
 * Create new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStudentDto) =>
      apiClient.post<Student>(apiEndpoints.students.create, data),
    onSuccess: () => {
      // Invalidate students list to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });

      toast({
        title: 'Success',
        description: 'Student created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create student',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) =>
      apiClient.patch<Student>(apiEndpoints.students.update(id), data),
    onSuccess: (updatedStudent) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(updatedStudent.id) });

      toast({
        title: 'Success',
        description: 'Student updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(apiEndpoints.students.delete(id)),
    onSuccess: () => {
      // Invalidate students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });

      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student',
        variant: 'destructive',
      });
    },
  });
}
