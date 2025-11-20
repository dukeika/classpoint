/**
 * Households List Page
 * Browse and manage family households
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Home, Users, Mail, Phone } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useHouseholds } from '@/lib/hooks';
import { Household } from '@/lib/types/entities';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function HouseholdsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <HouseholdsContent />
    </AuthGuard>
  );
}

function HouseholdsContent() {
  const { data, isLoading, isError, error } = useHouseholds();
  const households = data?.data || [];

  // Define table columns
  const columns: ColumnDef<Household>[] = [
    {
      accessorKey: 'name',
      header: 'Household Name',
      cell: ({ row }) => {
        const household = row.original;
        return (
          <div>
            <div className="font-medium">{household.name}</div>
            {household.primaryContact && (
              <div className="text-sm text-muted-foreground">
                Contact: {household.primaryContact}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => {
        const address = row.getValue('address') as string | undefined;
        return address || <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string | undefined;
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
        const phone = row.getValue('phone') as string | undefined;
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
      id: 'members',
      header: 'Members',
      cell: ({ row }) => {
        const household = row.original;
        const studentCount = household.students?.length || 0;
        const parentCount = household.parents?.length || 0;
        return (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {studentCount} student{studentCount !== 1 ? 's' : ''}, {parentCount} parent
              {parentCount !== 1 ? 's' : ''}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const household = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/households/${household.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/households/${household.id}/edit`}>
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
          <h1 className="text-3xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground mt-2">
            Manage family households and their members
          </p>
        </div>
        <Link href="/dashboard/households/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Household
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : households.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                households.reduce((sum, h) => sum + (h.students?.length || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                households.reduce((sum, h) => sum + (h.parents?.length || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Households Table */}
      <Card>
        <CardHeader>
          <CardTitle>Household Directory</CardTitle>
          <CardDescription>
            A list of all households including contact information and family members
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
              <div className="text-destructive mb-2">Error loading households</div>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : households.length === 0 ? (
            <div className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No households found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first household
              </p>
              <Link href="/dashboard/households/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Household
                </Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={households}
              searchKey="name"
              searchPlaceholder="Search households..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
