/**
 * Edit Class Page
 * Form to update an existing class's information
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useClass, useUpdateClass } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Validation schema
const classSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  section: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').optional().or(z.literal('')),
  academicYear: z.string().optional().or(z.literal('')),
  schedule: z.string().optional().or(z.literal('')),
  room: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

type ClassFormData = z.infer<typeof classSchema>;

export default function EditClassPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <EditClassContent />
    </AuthGuard>
  );
}

function EditClassContent() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const { data: classData, isLoading } = useClass(classId);
  const updateClass = useUpdateClass();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  });

  // Populate form when class data loads
  useEffect(() => {
    if (classData) {
      reset({
        name: classData.name,
        description: classData.description || '',
        gradeLevel: classData.gradeLevel || '',
        section: classData.section || '',
        capacity: classData.capacity || ('' as any),
        academicYear: classData.academicYear || '',
        schedule: classData.schedule || '',
        room: classData.room || '',
        status: classData.status as any,
      });
    }
  }, [classData, reset]);

  const onSubmit = async (data: ClassFormData) => {
    // Clean up empty optional fields
    const payload = {
      ...data,
      description: data.description || undefined,
      gradeLevel: data.gradeLevel || undefined,
      section: data.section || undefined,
      capacity: data.capacity || undefined,
      academicYear: data.academicYear || undefined,
      schedule: data.schedule || undefined,
      room: data.room || undefined,
    };

    updateClass.mutate(
      { id: classId, data: payload },
      {
        onSuccess: () => {
          router.push(`/dashboard/classes/${classId}`);
        },
      }
    );
  };

  // Generate academic year options
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}/${year + 1}`;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Class not found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The class you're trying to edit doesn't exist
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard/classes" className="hover:text-foreground">
            Classes
          </Link>
          <span>/</span>
          <Link href={`/dashboard/classes/${classId}`} className="hover:text-foreground">
            {classData.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">Edit</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Class</h1>
        <p className="text-muted-foreground mt-2">Update {classData.name}'s information</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Class Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Class Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Mathematics 101, Grade 5A"
                  {...register('name')}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the class"
                  rows={3}
                  {...register('description')}
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Grade Level */}
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    placeholder="e.g., Grade 5, Year 10"
                    {...register('gradeLevel')}
                    disabled={isSubmitting}
                  />
                  {errors.gradeLevel && (
                    <p className="text-sm text-destructive">{errors.gradeLevel.message}</p>
                  )}
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="e.g., A, B, Section 1"
                    {...register('section')}
                    disabled={isSubmitting}
                  />
                  {errors.section && (
                    <p className="text-sm text-destructive">{errors.section.message}</p>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label htmlFor="capacity">Class Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="30"
                    min="1"
                    {...register('capacity')}
                    disabled={isSubmitting}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-destructive">{errors.capacity.message}</p>
                  )}
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Select
                    onValueChange={(value) => setValue('academicYear', value)}
                    defaultValue={classData.academicYear || ''}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="academicYear">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academicYear && (
                    <p className="text-sm text-destructive">{errors.academicYear.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Location */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Location</CardTitle>
              <CardDescription>When and where the class meets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Schedule */}
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    placeholder="e.g., Mon, Wed, Fri 9:00-10:30"
                    {...register('schedule')}
                    disabled={isSubmitting}
                  />
                  {errors.schedule && (
                    <p className="text-sm text-destructive">{errors.schedule.message}</p>
                  )}
                </div>

                {/* Room */}
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    placeholder="e.g., Room 101, Building A"
                    {...register('room')}
                    disabled={isSubmitting}
                  />
                  {errors.room && <p className="text-sm text-destructive">{errors.room.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Class Status</CardTitle>
              <CardDescription>Set the current status of the class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue('status', value as any)}
                  defaultValue={classData.status}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {updateClass.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateClass.error instanceof Error
                  ? updateClass.error.message
                  : 'Failed to update class. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting || updateClass.isPending}>
              {isSubmitting || updateClass.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/dashboard/classes/${classId}`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
