/**
 * Announcement Detail Page
 * View announcement details and manage status
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Megaphone, Calendar, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAnnouncement, useDeleteAnnouncement } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AnnouncementDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <AnnouncementDetailContent />
    </AuthGuard>
  );
}

function AnnouncementDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: announcement, isLoading, isError, error } = useAnnouncement(id);
  const deleteAnnouncement = useDeleteAnnouncement();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteAnnouncement.mutateAsync(id);
      router.push('/dashboard/announcements');
    } catch (error) {
      console.error('Failed to delete announcement:', error);
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

  if (isError || !announcement) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load announcement'}
        </AlertDescription>
      </Alert>
    );
  }

  const priorityColor =
    announcement.priority === 'high'
      ? 'destructive'
      : announcement.priority === 'medium'
      ? 'default'
      : 'secondary';

  const statusColor = announcement.status === 'published' ? 'default' : 'secondary';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/announcements" className="hover:text-foreground">
          Announcements
        </Link>
        <span>/</span>
        <span className="text-foreground">{announcement.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/announcements">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{announcement.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={priorityColor}>{announcement.priority} priority</Badge>
                  <Badge variant={statusColor}>{announcement.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/announcements/${id}/edit`}>
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

      {/* Announcement Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Announcement Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-base">{announcement.content}</p>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Information */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Publish Date
              </Label>
              <p className="text-lg font-medium">
                {format(new Date(announcement.publishDate), 'PPP p')}
              </p>
            </div>
            {announcement.expiryDate && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Expiry Date
                </Label>
                <p className="text-lg font-medium">
                  {format(new Date(announcement.expiryDate), 'PPP p')}
                </p>
              </div>
            )}
            {!announcement.expiryDate && (
              <div>
                <Label className="text-muted-foreground">Expiry Date</Label>
                <p className="text-muted-foreground">No expiry date set</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audience Information */}
        <Card>
          <CardHeader>
            <CardTitle>Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            {announcement.targetAudience && announcement.targetAudience.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {announcement.targetAudience.length} Group(s)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {announcement.targetAudience.map((audience, index) => (
                    <Badge key={index} variant="outline">
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Users
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  This announcement will be visible to all users
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority & Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Priority</Label>
              <div className="mt-1">
                <Badge variant={priorityColor}>{announcement.priority}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={statusColor}>{announcement.status}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Announcement ID</Label>
              <p className="text-sm font-mono mt-1">{announcement.id}</p>
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
                {format(new Date(announcement.createdAt), 'PPP p')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p className="text-sm">
                {format(new Date(announcement.updatedAt), 'PPP p')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
