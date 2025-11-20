/**
 * Announcement React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useAnnouncements(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.announcements.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<Announcement>>(apiEndpoints.announcements.list),
  });
}

export function useAnnouncement(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: () => apiClient.get<Announcement>(apiEndpoints.announcements.get(id)),
    enabled: !!id && enabled,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAnnouncementDto) =>
      apiClient.post<Announcement>(apiEndpoints.announcements.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
      toast({ title: 'Success', description: 'Announcement created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementDto }) =>
      apiClient.patch<Announcement>(apiEndpoints.announcements.update(id), data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(updated.id) });
      toast({ title: 'Success', description: 'Announcement updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.announcements.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
      toast({ title: 'Success', description: 'Announcement deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
