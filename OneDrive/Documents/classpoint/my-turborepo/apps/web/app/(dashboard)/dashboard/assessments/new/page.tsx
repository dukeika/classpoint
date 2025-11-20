/**
 * Create Assessment Page
 * Form to create a new assessment
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCreateAssessment } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const createAssessmentSchema = z.object({
  termId: z.string().min(1, 'Term is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  type: z.enum(['CA1', 'CA2', 'CA3', 'EXAM', 'PROJECT', 'PRACTICAL'], {
    required_error: 'Assessment type is required',
  }),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
  maxScore: z.number().min(1, 'Max score must be at least 1'),
});

type CreateAssessmentFormData = z.infer<typeof createAssessmentSchema>;

export default function CreateAssessmentPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <CreateAssessmentContent />
    </AuthGuard>
  );
}

function CreateAssessmentContent() {
  const router = useRouter();
  const createAssessment = useCreateAssessment();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssessmentFormData>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      weight: 10,
      maxScore: 10,
    },
  });

  const onSubmit = async (data: CreateAssessmentFormData) => {
    try {
      setErrorMessage('');
      await createAssessment.mutateAsync(data);
      router.push('/dashboard/assessments');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create assessment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/assessments" className="hover:text-foreground">
          Assessments
        </Link>
        <span>/</span>
        <span className="text-foreground">Create</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/assessments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Assessment</h1>
          <p className="text-muted-foreground mt-2">Add a new assessment for grading</p>
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
        {/* Assessment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Information</CardTitle>
            <CardDescription>Define the assessment details and grading criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Term */}
              <div className="space-y-2">
                <Label htmlFor="termId">
                  Term <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="termId"
                  {...register('termId')}
                  placeholder="Enter term ID (e.g., term-2024-1)"
                />
                {errors.termId && (
                  <p className="text-sm text-destructive">{errors.termId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The academic term for this assessment
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subjectId"
                  {...register('subjectId')}
                  placeholder="Enter subject ID (e.g., subject-math)"
                />
                {errors.subjectId && (
                  <p className="text-sm text-destructive">{errors.subjectId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">The subject being assessed</p>
              </div>
            </div>

            {/* Assessment Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Assessment Type <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue('type', value as any)}
                defaultValue={watch('type')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA1">Continuous Assessment 1</SelectItem>
                  <SelectItem value="CA2">Continuous Assessment 2</SelectItem>
                  <SelectItem value="CA3">Continuous Assessment 3</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="PRACTICAL">Practical</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight">
                  Weight (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  max="100"
                  {...register('weight', { valueAsNumber: true })}
                  placeholder="e.g., 10"
                />
                {errors.weight && (
                  <p className="text-sm text-destructive">{errors.weight.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Percentage weight in final grade (0-100)
                </p>
              </div>

              {/* Max Score */}
              <div className="space-y-2">
                <Label htmlFor="maxScore">
                  Maximum Score <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  {...register('maxScore', { valueAsNumber: true })}
                  placeholder="e.g., 10"
                />
                {errors.maxScore && (
                  <p className="text-sm text-destructive">{errors.maxScore.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Highest possible score for this assessment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Assessment
              </>
            )}
          </Button>
          <Link href="/dashboard/assessments">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
