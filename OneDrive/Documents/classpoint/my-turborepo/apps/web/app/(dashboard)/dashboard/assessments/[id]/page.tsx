/**
 * Assessment Detail Page
 * View assessment details and enter/edit grades
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Save, Award } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAssessment, useGradesByAssessment, useDeleteAssessment, useBulkCreateGrades } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  CA1: 'CA 1',
  CA2: 'CA 2',
  CA3: 'CA 3',
  EXAM: 'Exam',
  PROJECT: 'Project',
  PRACTICAL: 'Practical',
};

export default function AssessmentDetailPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <AssessmentDetailContent />
    </AuthGuard>
  );
}

function AssessmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: assessment, isLoading, isError, error } = useAssessment(id);
  const { data: grades, isLoading: gradesLoading } = useGradesByAssessment(id);
  const deleteAssessment = useDeleteAssessment();
  const bulkCreateGrades = useBulkCreateGrades();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, number>>({});

  const handleDelete = async () => {
    try {
      await deleteAssessment.mutateAsync(id);
      router.push('/dashboard/assessments');
    } catch (error) {
      console.error('Failed to delete assessment:', error);
    }
  };

  const handleGradeChange = (studentId: string, score: number) => {
    setGradeInputs((prev) => ({
      ...prev,
      [studentId]: score,
    }));
  };

  const handleSaveGrades = async () => {
    const gradesToCreate = Object.entries(gradeInputs).map(([studentId, score]) => ({
      studentId,
      score,
    }));

    if (gradesToCreate.length === 0) {
      return;
    }

    try {
      await bulkCreateGrades.mutateAsync({
        assessmentId: id,
        grades: gradesToCreate,
      });
      setGradeInputs({});
    } catch (error) {
      console.error('Failed to save grades:', error);
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

  if (isError || !assessment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load assessment'}
        </AlertDescription>
      </Alert>
    );
  }

  const gradesList = grades || [];
  const gradedCount = gradesList.length;
  const averageScore = gradedCount > 0
    ? gradesList.reduce((sum, g) => sum + g.score, 0) / gradedCount
    : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/assessments" className="hover:text-foreground">
          Assessments
        </Link>
        <span>/</span>
        <span className="text-foreground">{assessment.subject?.name || 'Assessment'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assessments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {assessment.subject?.name || 'Assessment'}
              </h1>
              <Badge>{ASSESSMENT_TYPE_LABELS[assessment.type] || assessment.type}</Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              {assessment.term?.name} • {assessment.weight}% weight • Max score: {assessment.maxScore}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/assessments/${id}/edit`}>
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Graded</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageScore.toFixed(1)} / {assessment.maxScore}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradedCount > 0
                ? ((gradesList.filter((g) => (g.score / assessment.maxScore) * 100 >= 50).length /
                    gradedCount) *
                    100).toFixed(0)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradedCount > 0
                ? Math.max(...gradesList.map((g) => g.score))
                : 0} / {assessment.maxScore}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Grades</CardTitle>
            <Button onClick={handleSaveGrades} disabled={Object.keys(gradeInputs).length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Grades
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gradesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : gradesList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No grades recorded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start entering scores for students
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b font-medium text-sm">
                <div>Student</div>
                <div>Score</div>
                <div>Percentage</div>
                <div>Remarks</div>
              </div>
              {gradesList.map((grade) => {
                const percentage = (grade.score / assessment.maxScore) * 100;
                return (
                  <div key={grade.id} className="grid grid-cols-4 gap-4 py-2 border-b items-center">
                    <div className="font-medium">
                      {grade.student?.firstName} {grade.student?.lastName}
                    </div>
                    <div>
                      {grade.score} / {assessment.maxScore}
                    </div>
                    <div>
                      <Badge variant={percentage >= 70 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}>
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {grade.remarks || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
