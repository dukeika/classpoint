/**
 * Class Detail Page
 * View detailed information about a specific class
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  UserPlus,
  FileText,
  ClipboardList,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useClass, useDeleteClass } from '@/lib/hooks';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClassDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <ClassDetailContent />
    </AuthGuard>
  );
}

function ClassDetailContent() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: classData, isLoading } = useClass(classId);
  const deleteClass = useDeleteClass();

  const handleDelete = () => {
    deleteClass.mutate(classId, {
      onSuccess: () => {
        router.push('/dashboard/classes');
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

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Class not found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The class you're looking for doesn't exist
              </p>
              <Link href="/dashboard/classes">
                <Button className="mt-4" variant="outline">
                  Back to Classes
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
            <Link href="/dashboard/classes" className="hover:text-foreground">
              Classes
            </Link>
            <span>/</span>
            <span className="text-foreground">{classData.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
            <Badge variant={classData.status === 'active' ? 'default' : 'secondary'}>
              {classData.status}
            </Badge>
          </div>
          {classData.description && (
            <p className="text-muted-foreground mt-2">{classData.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/classes/${classId}/edit`}>
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
          {/* Class Information */}
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
              <CardDescription>Basic details about this class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Class Name</div>
                  <div className="text-sm">{classData.name}</div>
                </div>
                {classData.gradeLevel && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Grade Level</div>
                    <div className="text-sm">
                      <Badge variant="outline">{classData.gradeLevel}</Badge>
                    </div>
                  </div>
                )}
                {classData.section && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Section</div>
                    <div className="text-sm">{classData.section}</div>
                  </div>
                )}
                {classData.capacity && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Capacity
                    </div>
                    <div className="text-sm">{classData.capacity} students</div>
                  </div>
                )}
                {classData.academicYear && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Academic Year
                    </div>
                    <div className="text-sm">{classData.academicYear}</div>
                  </div>
                )}
                {classData.schedule && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Schedule
                    </div>
                    <div className="text-sm">{classData.schedule}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Students, Assignments, Attendance */}
          <Card>
            <Tabs defaultValue="students" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="students">
                    <Users className="h-4 w-4 mr-2" />
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="assignments">
                    <FileText className="h-4 w-4 mr-2" />
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger value="attendance">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Attendance
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="students" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Students enrolled in this class
                    </p>
                    <Link href={`/dashboard/enrollments/new?classId=${classId}`}>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Enroll Student
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>No students enrolled yet</p>
                    <p className="text-sm mt-1">
                      Enroll students to get started
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="assignments" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Assignments for this class
                    </p>
                    <Link href={`/dashboard/assignments/new?classId=${classId}`}>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assignment
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No assignments yet</p>
                    <p className="text-sm mt-1">
                      Create assignments to track student work
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="attendance" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Attendance records for this class
                    </p>
                    <Link href={`/dashboard/attendance?classId=${classId}`}>
                      <Button size="sm">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Mark Attendance
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4" />
                    <p>No attendance records yet</p>
                    <p className="text-sm mt-1">
                      Start marking attendance to track student presence
                    </p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
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
                  <Users className="h-4 w-4" />
                  Enrolled
                </div>
                <div className="text-sm font-medium">0 / {classData.capacity || 0}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Assignments
                </div>
                <div className="text-sm font-medium">0</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Created
                </div>
                <div className="text-sm font-medium">{formatDate(classData.createdAt)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/enrollments?classId=${classId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View Enrollments
                </Button>
              </Link>
              <Link href={`/dashboard/attendance?classId=${classId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </Link>
              <Link href={`/dashboard/assignments?classId=${classId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
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
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {classData.name}? This action cannot be undone and
              will affect all enrolled students and associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteClass.isPending}
            >
              {deleteClass.isPending ? 'Deleting...' : 'Delete Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
