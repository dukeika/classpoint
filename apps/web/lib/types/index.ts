// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  tenantId: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Tenant types
export interface Tenant {
  id: string
  schoolName: string
  slug: string
  email?: string
  phone?: string
  address?: string
  isActive: boolean
  planId?: string
  createdAt: string
  updatedAt: string
  currentEnrollment?: number
  studentCap?: number
  // Public landing page fields
  logo?: string
  tagline?: string
  description?: string
  heroImage?: string
  yearEstablished?: number
  studentCount?: string
  teacherCount?: string
  successRate?: string
  aboutText?: string
  mission?: string
  vision?: string
  website?: string
}

// Student types
export interface Student {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth: Date | string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  enrollmentStatus: 'ENROLLED' | 'GRADUATED' | 'WITHDRAWN'
  tenantId: string
  householdId?: string
  createdAt: string
  updatedAt: string
}

// Class types
export interface Class {
  id: string
  name: string
  code: string
  description?: string
  capacity: number
  currentEnrollment: number
  academicLevel: string
  isActive: boolean
  tenantId: string
  termId: string
  createdAt: string
  updatedAt: string
}

// Enrollment types
export interface Enrollment {
  id: string
  studentId: string
  classId: string
  termId: string
  enrollmentDate: string
  status: 'ENROLLED' | 'COMPLETED' | 'WITHDRAWN'
  tenantId: string
  createdAt: string
  updatedAt: string
}

// Assignment types
export interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  totalPoints: number
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classId: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page?: number
  limit?: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
