/**
 * Assessments List Page
 * Browse and manage all assessments with filters
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trophy, FileText } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAssessments } from '@/lib/hooks';
import { Assessment } from '@/lib/types/entities';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  CA1: 'CA 1',
  CA2: 'CA 2',
  CA3: 'CA 3',
  EXAM: 'Exam',
  PROJECT: 'Project',
  PRACTICAL: 'Practical',
};

const ASSESSMENT_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  CA1: 'secondary',
  CA2: 'secondary',
  CA3: 'secondary',
  EXAM: 'default',
  PROJECT: 'outline',
  PRACTICAL: 'outline',
};

export default function AssessmentsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <AssessmentsContent />
    </AuthGuard>
  );
}

function AssessmentsContent() {
  const { data, isLoading, isError, error } = useAssessments();
  const assessments = data?.data || [];

  // Define table columns
  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = row.original.subject;
        return (
          <div className="font-medium">
            {subject?.name || <span className="text-muted-foreground">—</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant={ASSESSMENT_TYPE_COLORS[type] || 'outline'}>
            {ASSESSMENT_TYPE_LABELS[type] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'term',
      header: 'Term',
      cell: ({ row }) => {
        const term = row.original.term;
        return term?.name || <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'weight',
      header: 'Weight',
      cell: ({ row }) => {
        const weight = row.getValue('weight') as number;
        return <span>{weight}%</span>;
      },
    },
    {
      accessorKey: 'maxScore',
      header: 'Max Score',
      cell: ({ row }) => {
        const maxScore = row.getValue('maxScore') as number;
        return <span>{maxScore}</span>;
      },
    },
    {
      id: 'graded',
      header: 'Graded',
      cell: ({ row }) => {
        const grades = row.original.grades || [];
        return (
          <div className="text-sm">
            <span className="font-medium">{grades.length}</span>
            <span className="text-muted-foreground"> students</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/assessments/${assessment.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/assessments/${assessment.id}/edit`}>
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
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-2">
            Manage assessments and student grades
          </p>
        </div>
        <Link href="/dashboard/assessments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : assessments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Continuous Assessment</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                assessments.filter((a) => ['CA1', 'CA2', 'CA3'].includes(a.type)).length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                assessments.filter((a) => a.type === 'EXAM').length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                assessments.filter((a) => ['PROJECT', 'PRACTICAL'].includes(a.type)).length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Directory</CardTitle>
          <CardDescription>
            A list of all assessments including their type, weight, and grading status
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
              <div className="text-destructive mb-2">Error loading assessments</div>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={assessments}
              searchKey="type"
              searchPlaceholder="Search assessments..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
