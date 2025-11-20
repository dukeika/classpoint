/**
 * Calendar Event Detail Page
 * View event details and manage status
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Calendar as CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCalendarEvent, useDeleteCalendarEvent } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function EventDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <EventDetailContent />
    </AuthGuard>
  );
}

function EventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: event, isLoading, isError, error } = useCalendarEvent(id);
  const deleteEvent = useDeleteCalendarEvent();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(id);
      router.push('/dashboard/calendar');
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load event'}
        </AlertDescription>
      </Alert>
    );
  }

  const eventTypeColor =
    event.eventType === 'holiday'
      ? 'default'
      : event.eventType === 'exam'
      ? 'destructive'
      : event.eventType === 'meeting'
      ? 'secondary'
      : 'outline';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/calendar" className="hover:text-foreground">
          Calendar
        </Link>
        <span>/</span>
        <span className="text-foreground">{event.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/calendar">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={eventTypeColor}>{event.eventType}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/calendar/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Confirm Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Event Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Description */}
        {event.description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Event Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-base">{event.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </Label>
              <p className="text-lg font-medium">
                {format(parseISO(event.startDate), 'PPP p')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time
              </Label>
              <p className="text-lg font-medium">
                {format(parseISO(event.endDate), 'PPP p')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              {event.location ? (
                <p className="text-lg font-medium">{event.location}</p>
              ) : (
                <p className="text-muted-foreground">No location specified</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </Label>
              {event.participants && event.participants.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.participants.map((participant, index) => (
                    <Badge key={index} variant="outline">
                      {participant}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No participants specified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Type & Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Event Type</Label>
              <div className="mt-1">
                <Badge variant={eventTypeColor}>{event.eventType}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Event ID</Label>
              <p className="text-sm font-mono mt-1">{event.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <p className="text-sm">
                {format(parseISO(event.createdAt), 'PPP p')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p className="text-sm">
                {format(parseISO(event.updatedAt), 'PPP p')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
