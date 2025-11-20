/**
 * Attendance React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  Attendance,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useAttendance(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<Attendance>>(apiEndpoints.attendance.list),
  });
}

export function useAttendanceRecord(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.detail(id),
    queryFn: () => apiClient.get<Attendance>(apiEndpoints.attendance.get(id)),
    enabled: !!id && enabled,
  });
}

export function useAttendanceByClass(classId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.byClass(classId, date),
    queryFn: () => apiClient.get<Attendance[]>(apiEndpoints.attendance.byClass(classId, date)),
    enabled: !!classId && !!date && enabled,
  });
}

export function useAttendanceByStudent(studentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.byStudent(studentId),
    queryFn: () => apiClient.get<Attendance[]>(apiEndpoints.attendance.byStudent(studentId)),
    enabled: !!studentId && enabled,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAttendanceDto) =>
      apiClient.post<Attendance>(apiEndpoints.attendance.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      toast({ title: 'Success', description: 'Attendance recorded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttendanceDto }) =>
      apiClient.patch<Attendance>(apiEndpoints.attendance.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      toast({ title: 'Success', description: 'Attendance updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.attendance.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      toast({ title: 'Success', description: 'Attendance deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
