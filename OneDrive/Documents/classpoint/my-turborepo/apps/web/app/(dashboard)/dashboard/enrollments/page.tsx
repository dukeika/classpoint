/**
 * Enrollments List Page
 * Browse and manage student enrollments in classes
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Plus, UserPlus, GraduationCap, Calendar } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useEnrollments } from '@/lib/hooks';
import { Enrollment } from '@/lib/types/entities';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  withdrawn: 'destructive',
};

export default function EnrollmentsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <EnrollmentsContent />
    </AuthGuard>
  );
}

function EnrollmentsContent() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading, isError, error } = useEnrollments({
    status: statusFilter || undefined,
  });
  const enrollments = data?.data || [];

  // Define table columns
  const columns: ColumnDef<Enrollment>[] = [
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const enrollment = row.original;
        return (
          <div className="font-medium">
            {enrollment.studentId}
          </div>
        );
      },
    },
    {
      id: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const enrollment = row.original;
        return (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span>{enrollment.classId}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'enrollmentDate',
      header: 'Enrollment Date',
      cell: ({ row }) => {
        const date = row.getValue('enrollmentDate') as string;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={STATUS_COLORS[status] || 'outline'}>
            {STATUS_LABELS[status] || status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const enrollment = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/enrollments/${enrollment.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
          <p className="text-muted-foreground mt-2">
            Manage student enrollments in classes
          </p>
        </div>
        <Link href="/dashboard/enrollments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : enrollments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                enrollments.filter((e) => e.status === 'active').length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                enrollments.filter((e) => e.status === 'completed').length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                enrollments.filter((e) => e.status === 'withdrawn').length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Directory</CardTitle>
          <CardDescription>
            A list of all student enrollments including their status and enrollment date
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
              <div className="text-destructive mb-2">Error loading enrollments</div>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No enrollments found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by enrolling your first student in a class
              </p>
              <Link href="/dashboard/enrollments/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={enrollments}
              searchKey="studentId"
              searchPlaceholder="Search by student..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
