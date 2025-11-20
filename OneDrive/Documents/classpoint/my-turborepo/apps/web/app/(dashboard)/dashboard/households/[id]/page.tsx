/**
 * Household Detail Page
 * View household details with students and parents
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Home, Users, Mail, Phone, MapPin } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useHousehold, useDeleteHousehold } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default function HouseholdDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <HouseholdDetailContent />
    </AuthGuard>
  );
}

function HouseholdDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: household, isLoading, isError, error } = useHousehold(id);
  const deleteHousehold = useDeleteHousehold();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteHousehold.mutateAsync(id);
      router.push('/dashboard/households');
    } catch (error) {
      console.error('Failed to delete household:', error);
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

  if (isError || !household) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load household'}
        </AlertDescription>
      </Alert>
    );
  }

  const studentCount = household.students?.length || 0;
  const parentCount = household.parents?.length || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/households" className="hover:text-foreground">
          Households
        </Link>
        <span>/</span>
        <span className="text-foreground">{household.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/households">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight">{household.name}</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              {studentCount} student{studentCount !== 1 ? 's' : ''}, {parentCount} parent
              {parentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/households/${id}/edit`}>
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

      {/* Household Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Household Name</Label>
              <p className="text-lg font-medium">{household.name}</p>
            </div>
            {household.primaryContact && (
              <div>
                <Label className="text-muted-foreground">Primary Contact</Label>
                <p className="text-lg font-medium">{household.primaryContact}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {household.email && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <a
                  href={`mailto:${household.email}`}
                  className="text-lg font-medium text-primary hover:underline"
                >
                  {household.email}
                </a>
              </div>
            )}
            {household.phone && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <a
                  href={`tel:${household.phone}`}
                  className="text-lg font-medium text-primary hover:underline"
                >
                  {household.phone}
                </a>
              </div>
            )}
            {household.address && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <p className="text-lg font-medium whitespace-pre-wrap">{household.address}</p>
              </div>
            )}
            {!household.email && !household.phone && !household.address && (
              <p className="text-muted-foreground text-sm">No contact information available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({studentCount})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {studentCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">No students in this household</p>
                <Link href="/dashboard/students/new">
                  <Button variant="outline" size="sm">
                    Add Student
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {household.students?.map((studentId) => (
                  <div
                    key={studentId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">Student ID: {studentId}</p>
                    </div>
                    <Link href={`/dashboard/students/${studentId}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parents ({parentCount})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {parentCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">No parents in this household</p>
                <Link href="/dashboard/parents/new">
                  <Button variant="outline" size="sm">
                    Add Parent
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {household.parents?.map((parentId) => (
                  <div
                    key={parentId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">Parent ID: {parentId}</p>
                    </div>
                    <Link href={`/dashboard/parents/${parentId}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Household ID</Label>
              <p className="text-sm font-mono">{household.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <p className="text-sm">
                {new Date(household.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p className="text-sm">
                {new Date(household.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
