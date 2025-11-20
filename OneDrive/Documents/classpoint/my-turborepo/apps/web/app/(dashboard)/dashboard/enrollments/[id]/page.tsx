/**
 * Enrollment Detail Page
 * View and manage a specific enrollment
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Calendar, GraduationCap, User } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useEnrollment, useDeleteEnrollment, useUpdateEnrollment } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  withdrawn: 'destructive',
};

export default function EnrollmentDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <EnrollmentDetailContent />
    </AuthGuard>
  );
}

function EnrollmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: enrollment, isLoading, isError, error } = useEnrollment(id);
  const deleteEnrollment = useDeleteEnrollment();
  const updateEnrollment = useUpdateEnrollment(id);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteEnrollment.mutateAsync(id);
      router.push('/dashboard/enrollments');
    } catch (error) {
      console.error('Failed to delete enrollment:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateEnrollment.mutateAsync({ status: newStatus as 'active' | 'completed' | 'withdrawn' });
    } catch (error) {
      console.error('Failed to update enrollment:', error);
    } finally {
      setIsUpdating(false);
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

  if (isError || !enrollment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load enrollment'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/enrollments" className="hover:text-foreground">
          Enrollments
        </Link>
        <span>/</span>
        <span className="text-foreground">Enrollment Details</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/enrollments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Enrollment Details</h1>
              <Badge variant={STATUS_COLORS[enrollment.status]}>
                {STATUS_LABELS[enrollment.status] || enrollment.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Enrolled on {new Date(enrollment.enrollmentDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Enrollment Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Student ID</Label>
              <p className="text-lg font-medium">{enrollment.studentId}</p>
            </div>
            <Link href={`/dashboard/students/${enrollment.studentId}`}>
              <Button variant="outline" className="w-full">
                View Student Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Class Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Class Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Class ID</Label>
              <p className="text-lg font-medium">{enrollment.classId}</p>
            </div>
            <Link href={`/dashboard/classes/${enrollment.classId}`}>
              <Button variant="outline" className="w-full">
                View Class Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Status & Details */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enrollment Date */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Enrollment Date
              </Label>
              <p className="text-lg font-medium">
                {new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Status Management */}
            <div className="space-y-2">
              <Label>Enrollment Status</Label>
              <Select
                value={enrollment.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Update the enrollment status as needed
              </p>
            </div>
          </div>

          {/* Record Metadata */}
          <div className="pt-6 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Enrollment ID</Label>
                <p className="text-sm font-mono">{enrollment.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm">
                  {new Date(enrollment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="text-sm">
                  {new Date(enrollment.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/dashboard/students/${enrollment.studentId}`}>
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                View Student
              </Button>
            </Link>
            <Link href={`/dashboard/classes/${enrollment.classId}`}>
              <Button variant="outline" className="w-full">
                <GraduationCap className="h-4 w-4 mr-2" />
                View Class
              </Button>
            </Link>
            <Link href={`/dashboard/attendance?studentId=${enrollment.studentId}&classId=${enrollment.classId}`}>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Attendance
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
