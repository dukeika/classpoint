import { apiClient } from './client'
import type { Student, PaginatedResponse } from '../types'

export interface GetStudentsParams {
  page?: number
  limit?: number
  search?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  enrollmentStatus?: 'ENROLLED' | 'GRADUATED' | 'WITHDRAWN'
}

export interface CreateStudentDto {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  householdId?: string
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {
  enrollmentStatus?: 'ENROLLED' | 'GRADUATED' | 'WITHDRAWN'
}

export const studentService = {
  /**
   * Get paginated list of students
   */
  getAll: async (params?: GetStudentsParams): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.gender) queryParams.append('gender', params.gender)
    if (params?.enrollmentStatus) queryParams.append('enrollmentStatus', params.enrollmentStatus)

    const query = queryParams.toString()
    const endpoint = query ? `/students?${query}` : '/students'

    return apiClient.get<PaginatedResponse<Student>>(endpoint)
  },

  /**
   * Get single student by ID
   */
  getById: async (id: string): Promise<Student> => {
    return apiClient.get<Student>(`/students/${id}`)
  },

  /**
   * Create new student
   */
  create: async (data: CreateStudentDto): Promise<Student> => {
    return apiClient.post<Student>('/students', data)
  },

  /**
   * Update existing student
   */
  update: async (id: string, data: UpdateStudentDto): Promise<Student> => {
    return apiClient.patch<Student>(`/students/${id}`, data)
  },

  /**
   * Delete student
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/students/${id}`)
  },

  /**
   * Get students by household
   */
  getByHousehold: async (householdId: string): Promise<Student[]> => {
    return apiClient.get<Student[]>(`/households/${householdId}/students`)
  },
}
