/**
 * Calendar Events Page
 * View and manage school calendar events
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Calendar as CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCalendarEvents } from '@/lib/hooks';
import { CalendarEvent } from '@/lib/types/entities';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CalendarPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <CalendarContent />
    </AuthGuard>
  );
}

function CalendarContent() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, isLoading, isError, error } = useCalendarEvents();
  const events = data?.data || [];

  // Apply filters
  const filteredEvents = events.filter((event) => {
    if (typeFilter !== 'all' && event.eventType !== typeFilter) return false;
    return true;
  });

  // Get events for current month (for calendar view)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsForMonth = filteredEvents.filter((event) => {
    const eventDate = parseISO(event.startDate);
    return isSameMonth(eventDate, currentDate);
  });

  // Count statistics
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.startDate) > new Date()).length;
  const todayEvents = events.filter((e) => isSameDay(parseISO(e.startDate), new Date())).length;

  // Event type colors
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return 'default';
      case 'exam':
        return 'destructive';
      case 'meeting':
        return 'secondary';
      case 'event':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return eventsForMonth.filter((event) => {
      const eventDate = parseISO(event.startDate);
      return isSameDay(eventDate, day);
    });
  };

  // Define table columns for list view
  const columns: ColumnDef<CalendarEvent>[] = [
    {
      accessorKey: 'title',
      header: 'Event',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div>
            <div className="font-medium">{event.title}</div>
            {event.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {event.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'eventType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('eventType') as string;
        return <Badge variant={getEventTypeColor(type)}>{type}</Badge>;
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => {
        const date = row.getValue('startDate') as string;
        return format(parseISO(date), 'PPP p');
      },
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => {
        const date = row.getValue('endDate') as string;
        return format(parseISO(date), 'PPP p');
      },
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const event = row.original;
        return event.location ? (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/calendar/${event.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/calendar/${event.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-2">
            View and manage school events and activities
          </p>
        </div>
        <Link href="/dashboard/calendar/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalEvents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : todayEvents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : upcomingEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>View Options</CardTitle>
          <CardDescription>Switch between calendar and list view, and filter by event type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Calendar View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[100px] border rounded-lg p-2 ${
                        isCurrentDay ? 'bg-primary/5 border-primary' : 'border-border'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <Link key={event.id} href={`/dashboard/calendar/${event.id}`}>
                            <div className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 truncate cursor-pointer">
                              {event.title}
                            </div>
                          </Link>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>
              A complete list of all calendar events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <div className="text-destructive mb-2">Error loading events</div>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'An error occurred'}
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first event
                </p>
                <Link href="/dashboard/calendar/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredEvents}
                searchKey="title"
                searchPlaceholder="Search events..."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
