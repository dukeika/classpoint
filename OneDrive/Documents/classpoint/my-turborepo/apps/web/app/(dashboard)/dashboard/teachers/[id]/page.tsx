/**
 * Teacher Detail Page
 * View detailed information about a specific teacher
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  Clock,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useTeacher, useDeleteTeacher } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function TeacherDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <TeacherDetailContent />
    </AuthGuard>
  );
}

function TeacherDetailContent() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: teacher, isLoading } = useTeacher(teacherId);
  const deleteTeacher = useDeleteTeacher();

  const handleDelete = () => {
    deleteTeacher.mutate(teacherId, {
      onSuccess: () => {
        router.push('/dashboard/teachers');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 md:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Teacher not found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The teacher you're looking for doesn't exist
              </p>
              <Link href="/dashboard/teachers">
                <Button className="mt-4" variant="outline">
                  Back to Teachers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/teachers" className="hover:text-foreground">
              Teachers
            </Link>
            <span>/</span>
            <span className="text-foreground">
              {teacher.firstName} {teacher.lastName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
              {teacher.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/teachers/${teacherId}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">First Name</div>
                  <div className="text-sm">{teacher.firstName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Last Name</div>
                  <div className="text-sm">{teacher.lastName}</div>
                </div>
                {teacher.dateOfBirth && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Date of Birth
                    </div>
                    <div className="text-sm">{formatDate(teacher.dateOfBirth)}</div>
                  </div>
                )}
                {teacher.gender && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Gender</div>
                    <div className="text-sm capitalize">{teacher.gender}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach this teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacher.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Email</div>
                    <a
                      href={`mailto:${teacher.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {teacher.email}
                    </a>
                  </div>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Phone</div>
                    <a
                      href={`tel:${teacher.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {teacher.phone}
                    </a>
                  </div>
                </div>
              )}
              {teacher.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Address</div>
                    <div className="text-sm text-muted-foreground">{teacher.address}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Classes</CardTitle>
              <CardDescription>Classes taught by this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <p>No classes assigned yet</p>
                <p className="text-sm mt-1">Assign classes from the Classes page</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  Classes
                </div>
                <div className="text-sm font-medium">0</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Students
                </div>
                <div className="text-sm font-medium">0</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Joined
                </div>
                <div className="text-sm font-medium">{formatDate(teacher.createdAt)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/classes?teacherId=${teacherId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Classes
                </Button>
              </Link>
              <Link href={`/dashboard/attendance?teacherId=${teacherId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Attendance
                </Button>
              </Link>
              <Link href={`/dashboard/assignments?teacherId=${teacherId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Assignments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {teacher.firstName} {teacher.lastName}? This action
              cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTeacher.isPending}
            >
              {deleteTeacher.isPending ? 'Deleting...' : 'Delete Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
