/**
 * Calendar Event React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiEndpoints } from '../api-client';
import { queryKeys } from './query-keys';
import type {
  CalendarEvent,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  PaginatedResponse,
  QueryParams,
} from '../types/entities';
import { useToast } from './use-toast';

export function useCalendarEvents(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.calendar.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<CalendarEvent>>(apiEndpoints.calendar.list),
  });
}

export function useCalendarEvent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.calendar.detail(id),
    queryFn: () => apiClient.get<CalendarEvent>(apiEndpoints.calendar.get(id)),
    enabled: !!id && enabled,
  });
}

export function useCalendarEventsByDate(date: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.calendar.byDate(date),
    queryFn: () => apiClient.get<CalendarEvent[]>(apiEndpoints.calendar.byDate(date)),
    enabled: !!date && enabled,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCalendarEventDto) =>
      apiClient.post<CalendarEvent>(apiEndpoints.calendar.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
      toast({ title: 'Success', description: 'Event created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarEventDto }) =>
      apiClient.patch<CalendarEvent>(apiEndpoints.calendar.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
      toast({ title: 'Success', description: 'Event updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(apiEndpoints.calendar.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
      toast({ title: 'Success', description: 'Event deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
