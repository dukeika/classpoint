/**
 * Teachers List Page
 * Browse and manage all teachers with search and filters
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Mail, Phone } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useTeachers } from '@/lib/hooks';
import { Teacher } from '@/lib/types/entities';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeachersPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <TeachersContent />
    </AuthGuard>
  );
}

function TeachersContent() {
  const { data, isLoading, isError, error } = useTeachers();
  const teachers = data?.data || [];

  // Define table columns
  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="font-medium">
            {teacher.firstName} {teacher.lastName}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        return email ? (
          <a
            href={`mailto:${email}`}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <Mail className="h-3 w-3" />
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <Phone className="h-3 w-3" />
            {phone}
          </a>
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
          status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline';
        return (
          <Badge variant={variant} className="capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Date of Birth',
      cell: ({ row }) => {
        const dob = row.getValue('dateOfBirth') as string | undefined;
        return dob ? (
          <span>{new Date(dob).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/teachers/${teacher.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
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
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-2">
            Manage teaching staff and their assignments
          </p>
        </div>
        <Link href="/dashboard/teachers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : teachers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                teachers.filter((t) => t.status === 'active').length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                teachers.filter((t) => t.status === 'inactive').length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Directory</CardTitle>
          <CardDescription>
            A list of all teachers including their contact information and status
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
              <div className="text-destructive mb-2">Error loading teachers</div>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={teachers}
              searchKey="firstName"
              searchPlaceholder="Search teachers..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
