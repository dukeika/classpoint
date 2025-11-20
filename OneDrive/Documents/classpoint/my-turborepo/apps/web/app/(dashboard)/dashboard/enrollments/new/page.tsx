/**
 * Enroll Student Page
 * Form to enroll a student in a class
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCreateEnrollment, useStudents, useClasses } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
});

type CreateEnrollmentFormData = z.infer<typeof createEnrollmentSchema>;

export default function EnrollStudentPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <EnrollStudentContent />
    </AuthGuard>
  );
}

function EnrollStudentContent() {
  const router = useRouter();
  const createEnrollment = useCreateEnrollment();
  const { data: studentsData } = useStudents();
  const { data: classesData } = useClasses();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const students = studentsData?.data || [];
  const classes = classesData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEnrollmentFormData>({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: {
      enrollmentDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: CreateEnrollmentFormData) => {
    try {
      setErrorMessage('');
      await createEnrollment.mutateAsync(data);
      router.push('/dashboard/enrollments');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to enroll student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/enrollments" className="hover:text-foreground">
          Enrollments
        </Link>
        <span>/</span>
        <span className="text-foreground">Enroll Student</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/enrollments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enroll Student</h1>
          <p className="text-muted-foreground mt-2">Enroll a student in a class</p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enrollment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Information</CardTitle>
            <CardDescription>Select the student and class for enrollment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="studentId">
                Student <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue('studentId', value)}
                defaultValue={watch('studentId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No students found. Please create a student first.
                    </div>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                        {student.email && ` (${student.email})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.studentId && (
                <p className="text-sm text-destructive">{errors.studentId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The student to be enrolled
              </p>
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="classId">
                Class <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue('classId', value)}
                defaultValue={watch('classId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No classes found. Please create a class first.
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.section && ` - ${cls.section}`}
                        {cls.academicYear && ` (${cls.academicYear})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.classId && (
                <p className="text-sm text-destructive">{errors.classId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The class the student will be enrolled in
              </p>
            </div>

            {/* Enrollment Date */}
            <div className="space-y-2">
              <Label htmlFor="enrollmentDate">
                Enrollment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="enrollmentDate"
                type="date"
                {...register('enrollmentDate')}
              />
              {errors.enrollmentDate && (
                <p className="text-sm text-destructive">{errors.enrollmentDate.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The date when the student is enrolling
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting || students.length === 0 || classes.length === 0}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Enrolling...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Student
              </>
            )}
          </Button>
          <Link href="/dashboard/enrollments">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>

        {/* Information */}
        {(students.length === 0 || classes.length === 0) && (
          <Alert>
            <AlertDescription>
              {students.length === 0 && classes.length === 0 && (
                <>
                  Please create at least one student and one class before enrolling.{' '}
                  <Link href="/dashboard/students/new" className="underline">
                    Create student
                  </Link>{' '}
                  or{' '}
                  <Link href="/dashboard/classes/new" className="underline">
                    Create class
                  </Link>
                  .
                </>
              )}
              {students.length === 0 && classes.length > 0 && (
                <>
                  Please create at least one student before enrolling.{' '}
                  <Link href="/dashboard/students/new" className="underline">
                    Create student
                  </Link>
                  .
                </>
              )}
              {students.length > 0 && classes.length === 0 && (
                <>
                  Please create at least one class before enrolling.{' '}
                  <Link href="/dashboard/classes/new" className="underline">
                    Create class
                  </Link>
                  .
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
