/**
 * Create Calendar Event Page
 * Form to create a new calendar event
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCreateCalendarEvent } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  eventType: z.enum(['holiday', 'exam', 'meeting', 'event', 'other']),
  location: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <CreateEventContent />
    </AuthGuard>
  );
}

function CreateEventContent() {
  const router = useRouter();
  const createEvent = useCreateCalendarEvent();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      eventType: 'event',
    },
  });

  const eventType = watch('eventType');

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      setErrorMessage('');
      await createEvent.mutateAsync(data);
      router.push('/dashboard/calendar');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/calendar" className="hover:text-foreground">
          Calendar
        </Link>
        <span>/</span>
        <span className="text-foreground">Create Event</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calendar">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Calendar Event</h1>
          <p className="text-muted-foreground mt-2">Add a new event to the school calendar</p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Enter the event information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., School Annual Day"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A clear, descriptive title for the event
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter event description..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: Detailed information about the event
              </p>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="eventType">
                Event Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={eventType}
                onValueChange={(value) => setValue('eventType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.eventType && (
                <p className="text-sm text-destructive">{errors.eventType.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The category of the event
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Date & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Location</CardTitle>
            <CardDescription>Set when and where the event will take place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  When the event starts
                </p>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  When the event ends
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., School Auditorium"
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: Where the event will take place
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information Notice */}
        <Alert>
          <AlertDescription>
            The event will be visible to all authorized users once created.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Create Event
              </>
            )}
          </Button>
          <Link href="/dashboard/calendar">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
