/**
 * Create Class Page
 * Form to add a new class to the system
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCreateClass, useTeachers } from '@/lib/hooks';
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

export default function NewClassPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <NewClassContent />
    </AuthGuard>
  );
}

function NewClassContent() {
  const router = useRouter();
  const createClass = useCreateClass();
  const { data: teachersData } = useTeachers();
  const teachers = teachersData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      status: 'active',
    },
  });

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

    createClass.mutate(payload, {
      onSuccess: () => {
        router.push('/dashboard/classes');
      },
    });
  };

  // Generate academic year options
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}/${year + 1}`;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard/classes" className="hover:text-foreground">
            Classes
          </Link>
          <span>/</span>
          <span className="text-foreground">Create Class</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Class</h1>
        <p className="text-muted-foreground mt-2">Set up a new class for the academic term</p>
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
                  defaultValue="active"
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
          {createClass.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {createClass.error instanceof Error
                  ? createClass.error.message
                  : 'Failed to create class. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting || createClass.isPending}>
              {isSubmitting || createClass.isPending ? 'Creating...' : 'Create Class'}
            </Button>
            <Link href="/dashboard/classes">
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
