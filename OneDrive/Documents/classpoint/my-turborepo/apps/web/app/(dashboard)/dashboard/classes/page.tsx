/**
 * Classes List Page
 * Browse and manage all classes with search and filters
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Users, BookOpen, Calendar } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useClasses } from '@/lib/hooks';
import { Class } from '@/lib/types/entities';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassesPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <ClassesContent />
    </AuthGuard>
  );
}

function ClassesContent() {
  const { data, isLoading, isError, error } = useClasses();
  const classes = data?.data || [];

  // Define table columns
  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'name',
      header: 'Class Name',
      cell: ({ row }) => {
        const classItem = row.original;
        return (
          <div>
            <div className="font-medium">{classItem.name}</div>
            {classItem.description && (
              <div className="text-sm text-muted-foreground">{classItem.description}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'gradeLevel',
      header: 'Grade Level',
      cell: ({ row }) => {
        const grade = row.getValue('gradeLevel') as string | undefined;
        return grade ? (
          <Badge variant="outline">{grade}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'section',
      header: 'Section',
      cell: ({ row }) => {
        const section = row.getValue('section') as string | undefined;
        return section || <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => {
        const capacity = row.getValue('capacity') as number | undefined;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{capacity || '—'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'academicYear',
      header: 'Academic Year',
      cell: ({ row }) => {
        const year = row.getValue('academicYear') as string | undefined;
        return year ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{year}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variant =
          status === 'active'
            ? 'default'
            : status === 'inactive'
            ? 'secondary'
            : 'outline';
        return (
          <Badge variant={variant} className="capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const classItem = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/classes/${classItem.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/classes/${classItem.id}/edit`}>
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
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-2">
            Manage classes, sections, and student enrollments
          </p>
        </div>
        <Link href="/dashboard/classes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : classes.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                classes.filter((c) => c.status === 'active').length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                classes.reduce((sum, c) => sum + (c.capacity || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : classes.length > 0 ? (
                Math.round(
                  classes.reduce((sum, c) => sum + (c.capacity || 0), 0) / classes.length
                )
              ) : (
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Class Directory</CardTitle>
          <CardDescription>
            A list of all classes including their grade level, capacity, and status
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
              <div className="text-destructive mb-2">Error loading classes</div>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={classes}
              searchKey="name"
              searchPlaceholder="Search classes..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
