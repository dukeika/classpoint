/**
 * Assessment and Grade React Query Hooks
 * Type-safe hooks for assessment and grade data management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentService, gradeService } from '../api/assessments';
import { queryKeys } from './query-keys';
import type {
  Assessment,
  CreateAssessmentDto,
  UpdateAssessmentDto,
  Grade,
  CreateGradeDto,
  UpdateGradeDto,
  PaginatedResponse,
} from '../types/entities';
import { useToast } from './use-toast';

/**
 * Fetch list of assessments
 */
export function useAssessments(params?: {
  page?: number;
  limit?: number;
  termId?: string;
  subjectId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.assessments.list(params),
    queryFn: () => assessmentService.getAll(params),
  });
}

/**
 * Fetch single assessment by ID
 */
export function useAssessment(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessments.detail(id),
    queryFn: () => assessmentService.getById(id),
    enabled: !!id && enabled,
  });
}

/**
 * Fetch assessments by term
 */
export function useAssessmentsByTerm(termId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessments.byTerm(termId),
    queryFn: () => assessmentService.getByTerm(termId),
    enabled: !!termId && enabled,
  });
}

/**
 * Fetch assessments by subject
 */
export function useAssessmentsBySubject(subjectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessments.bySubject(subjectId),
    queryFn: () => assessmentService.getBySubject(subjectId),
    enabled: !!subjectId && enabled,
  });
}

/**
 * Create new assessment
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAssessmentDto) => assessmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });

      toast({
        title: 'Success',
        description: 'Assessment created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assessment',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing assessment
 */
export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssessmentDto }) =>
      assessmentService.update(id, data),
    onSuccess: (updatedAssessment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.detail(updatedAssessment.id) });

      toast({
        title: 'Success',
        description: 'Assessment updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assessment',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete assessment
 */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assessmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });

      toast({
        title: 'Success',
        description: 'Assessment deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete assessment',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Fetch list of grades
 */
export function useGrades(params?: {
  page?: number;
  limit?: number;
  assessmentId?: string;
  studentId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.grades.list(params),
    queryFn: () => gradeService.getAll(params),
  });
}

/**
 * Fetch single grade by ID
 */
export function useGrade(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.grades.detail(id),
    queryFn: () => gradeService.getById(id),
    enabled: !!id && enabled,
  });
}

/**
 * Fetch grades by assessment
 */
export function useGradesByAssessment(assessmentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.grades.byAssessment(assessmentId),
    queryFn: () => gradeService.getByAssessment(assessmentId),
    enabled: !!assessmentId && enabled,
  });
}

/**
 * Fetch grades by student
 */
export function useGradesByStudent(studentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.grades.byStudent(studentId),
    queryFn: () => gradeService.getByStudent(studentId),
    enabled: !!studentId && enabled,
  });
}

/**
 * Create new grade
 */
export function useCreateGrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateGradeDto) => gradeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grades.lists() });

      toast({
        title: 'Success',
        description: 'Grade recorded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record grade',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing grade
 */
export function useUpdateGrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeDto }) =>
      gradeService.update(id, data),
    onSuccess: (updatedGrade) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grades.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.grades.detail(updatedGrade.id) });

      toast({
        title: 'Success',
        description: 'Grade updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update grade',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete grade
 */
export function useDeleteGrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => gradeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grades.lists() });

      toast({
        title: 'Success',
        description: 'Grade deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete grade',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk create grades for an assessment
 */
export function useBulkCreateGrades() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      assessmentId,
      grades,
    }: {
      assessmentId: string;
      grades: Omit<CreateGradeDto, 'assessmentId'>[];
    }) => gradeService.bulkCreate(assessmentId, grades),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grades.lists() });

      toast({
        title: 'Success',
        description: 'Grades recorded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record grades',
        variant: 'destructive',
      });
    },
  });
}
