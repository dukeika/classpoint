/**
 * Assessment API Client
 * Handles all assessment and grade-related API calls
 */

import { apiClient } from './client'
import type {
  Assessment,
  CreateAssessmentDto,
  UpdateAssessmentDto,
  Grade,
  CreateGradeDto,
  UpdateGradeDto,
  PaginatedResponse,
} from '../types'

export interface GetAssessmentsParams {
  page?: number
  limit?: number
  termId?: string
  subjectId?: string
  type?: 'CA1' | 'CA2' | 'CA3' | 'EXAM' | 'PROJECT' | 'PRACTICAL'
}

export interface GetGradesParams {
  page?: number
  limit?: number
  assessmentId?: string
  studentId?: string
}

export const assessmentService = {
  /**
   * Get paginated list of assessments
   */
  getAll: async (params?: GetAssessmentsParams): Promise<PaginatedResponse<Assessment>> => {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.termId) queryParams.append('termId', params.termId)
    if (params?.subjectId) queryParams.append('subjectId', params.subjectId)
    if (params?.type) queryParams.append('type', params.type)

    const query = queryParams.toString()
    const endpoint = query ? `/assessments?${query}` : '/assessments'

    return apiClient.get<PaginatedResponse<Assessment>>(endpoint)
  },

  /**
   * Get single assessment by ID
   */
  getById: async (id: string): Promise<Assessment> => {
    return apiClient.get<Assessment>(`/assessments/${id}`)
  },

  /**
   * Create new assessment
   */
  create: async (data: CreateAssessmentDto): Promise<Assessment> => {
    return apiClient.post<Assessment>('/assessments', data)
  },

  /**
   * Update existing assessment
   */
  update: async (id: string, data: UpdateAssessmentDto): Promise<Assessment> => {
    return apiClient.patch<Assessment>(`/assessments/${id}`, data)
  },

  /**
   * Delete assessment
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/assessments/${id}`)
  },

  /**
   * Get assessments by term
   */
  getByTerm: async (termId: string): Promise<Assessment[]> => {
    return apiClient.get<Assessment[]>(`/terms/${termId}/assessments`)
  },

  /**
   * Get assessments by subject
   */
  getBySubject: async (subjectId: string): Promise<Assessment[]> => {
    return apiClient.get<Assessment[]>(`/subjects/${subjectId}/assessments`)
  },
}

export const gradeService = {
  /**
   * Get paginated list of grades
   */
  getAll: async (params?: GetGradesParams): Promise<PaginatedResponse<Grade>> => {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.assessmentId) queryParams.append('assessmentId', params.assessmentId)
    if (params?.studentId) queryParams.append('studentId', params.studentId)

    const query = queryParams.toString()
    const endpoint = query ? `/grades?${query}` : '/grades'

    return apiClient.get<PaginatedResponse<Grade>>(endpoint)
  },

  /**
   * Get single grade by ID
   */
  getById: async (id: string): Promise<Grade> => {
    return apiClient.get<Grade>(`/grades/${id}`)
  },

  /**
   * Create new grade
   */
  create: async (data: CreateGradeDto): Promise<Grade> => {
    return apiClient.post<Grade>('/grades', data)
  },

  /**
   * Update existing grade
   */
  update: async (id: string, data: UpdateGradeDto): Promise<Grade> => {
    return apiClient.patch<Grade>(`/grades/${id}`, data)
  },

  /**
   * Delete grade
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/grades/${id}`)
  },

  /**
   * Get grades by assessment
   */
  getByAssessment: async (assessmentId: string): Promise<Grade[]> => {
    return apiClient.get<Grade[]>(`/assessments/${assessmentId}/grades`)
  },

  /**
   * Get grades by student
   */
  getByStudent: async (studentId: string): Promise<Grade[]> => {
    return apiClient.get<Grade[]>(`/students/${studentId}/grades`)
  },

  /**
   * Bulk create grades for an assessment
   */
  bulkCreate: async (assessmentId: string, grades: Omit<CreateGradeDto, 'assessmentId'>[]): Promise<Grade[]> => {
    return apiClient.post<Grade[]>(`/assessments/${assessmentId}/grades/bulk`, { grades })
  },
}
