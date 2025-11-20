/**
 * Edit Teacher Page
 * Form to update an existing teacher's information
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useTeacher, useUpdateTeacher } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
const teacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  address: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

export default function EditTeacherPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <EditTeacherContent />
    </AuthGuard>
  );
}

function EditTeacherContent() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const { data: teacher, isLoading } = useTeacher(teacherId);
  const updateTeacher = useUpdateTeacher();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
  });

  // Populate form when teacher data loads
  useEffect(() => {
    if (teacher) {
      reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email || '',
        phone: teacher.phone || '',
        dateOfBirth: teacher.dateOfBirth
          ? new Date(teacher.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: (teacher.gender as any) || '',
        address: teacher.address || '',
        status: teacher.status as any,
      });
    }
  }, [teacher, reset]);

  const onSubmit = async (data: TeacherFormData) => {
    // Clean up empty optional fields
    const payload = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender && data.gender !== '' ? data.gender : undefined,
      address: data.address || undefined,
    };

    updateTeacher.mutate(
      { id: teacherId, data: payload },
      {
        onSuccess: () => {
          router.push(`/dashboard/teachers/${teacherId}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Teacher not found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The teacher you're trying to edit doesn't exist
              </p>
              <Link href="/dashboard/teachers">
                <Button className="mt-4" variant="outline">
                  Back to Teachers
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
          <Link href="/dashboard/teachers" className="hover:text-foreground">
            Teachers
          </Link>
          <span>/</span>
          <Link href={`/dashboard/teachers/${teacherId}`} className="hover:text-foreground">
            {teacher.firstName} {teacher.lastName}
          </Link>
          <span>/</span>
          <span className="text-foreground">Edit</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Teacher</h1>
        <p className="text-muted-foreground mt-2">
          Update {teacher.firstName} {teacher.lastName}'s information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register('firstName')}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register('lastName')}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    disabled={isSubmitting}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) => setValue('gender', value as any)}
                    defaultValue={teacher.gender || ''}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach this teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@school.com"
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    {...register('phone')}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street, City"
                  {...register('address')}
                  disabled={isSubmitting}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Status</CardTitle>
              <CardDescription>Current employment status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue('status', value as any)}
                  defaultValue={teacher.status}
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
          {updateTeacher.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateTeacher.error instanceof Error
                  ? updateTeacher.error.message
                  : 'Failed to update teacher. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting || updateTeacher.isPending}>
              {isSubmitting || updateTeacher.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/dashboard/teachers/${teacherId}`}>
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
