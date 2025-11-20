/**
 * Announcements List Page
 * Browse and manage school announcements
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Megaphone, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAnnouncements } from '@/lib/hooks';
import { Announcement } from '@/lib/types/entities';
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

export default function AnnouncementsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <AnnouncementsContent />
    </AuthGuard>
  );
}

function AnnouncementsContent() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data, isLoading, isError, error } = useAnnouncements();
  const announcements = data?.data || [];

  // Apply filters
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (statusFilter !== 'all' && announcement.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && announcement.priority !== priorityFilter) return false;
    return true;
  });

  // Count statistics
  const totalAnnouncements = announcements.length;
  const published = announcements.filter((a) => a.status === 'published').length;
  const drafts = announcements.filter((a) => a.status === 'draft').length;
  const highPriority = announcements.filter((a) => a.priority === 'high').length;

  // Define table columns
  const columns: ColumnDef<Announcement>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const announcement = row.original;
        return (
          <div>
            <div className="font-medium">{announcement.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">
              {announcement.content}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string;
        return (
          <Badge
            variant={
              priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary'
            }
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'publishDate',
      header: 'Publish Date',
      cell: ({ row }) => {
        const date = row.getValue('publishDate') as string;
        return format(new Date(date), 'PPP');
      },
    },
    {
      id: 'targetAudience',
      header: 'Audience',
      cell: ({ row }) => {
        const announcement = row.original;
        const audience = announcement.targetAudience || [];
        if (audience.length === 0) return <span className="text-muted-foreground">All</span>;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{audience.length} groups</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const announcement = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/announcements/${announcement.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/announcements/${announcement.id}/edit`}>
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
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-2">
            Manage school announcements and communications
          </p>
        </div>
        <Link href="/dashboard/announcements/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalAnnouncements}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : published}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : drafts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Megaphone className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : highPriority}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter announcements by status and priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>
            A list of all announcements including drafts and published
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
              <div className="text-destructive mb-2">Error loading announcements</div>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No announcements found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first announcement
              </p>
              <Link href="/dashboard/announcements/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAnnouncements}
              searchKey="title"
              searchPlaceholder="Search announcements..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
