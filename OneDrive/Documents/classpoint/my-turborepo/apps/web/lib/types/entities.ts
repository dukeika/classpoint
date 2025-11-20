/**
 * Entity Type Definitions
 * TypeScript types for all ClassPoint entities
 */

// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Tenant/School
export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings?: Record<string, unknown>;
  isActive: boolean;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {
  isActive?: boolean;
}

// Student
export interface Student extends BaseEntity {
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  enrollmentDate?: string;
  status: 'active' | 'inactive' | 'graduated' | 'withdrawn';
}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  enrollmentDate?: string;
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {
  status?: 'active' | 'inactive' | 'graduated' | 'withdrawn';
}

// Teacher
export interface Teacher extends BaseEntity {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  hireDate?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'on-leave';
}

export interface CreateTeacherDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  hireDate?: string;
  specialization?: string;
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {
  status?: 'active' | 'inactive' | 'on-leave';
}

// Parent
export interface Parent extends BaseEntity {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  relationship?: string;
  occupation?: string;
}

export interface CreateParentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  relationship?: string;
  occupation?: string;
}

export interface UpdateParentDto extends Partial<CreateParentDto> {}

// Class
export interface Class extends BaseEntity {
  tenantId: string;
  name: string;
  grade?: string;
  section?: string;
  teacherId?: string;
  room?: string;
  schedule?: Record<string, unknown>;
  capacity?: number;
  academicYear?: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface CreateClassDto {
  name: string;
  grade?: string;
  section?: string;
  teacherId?: string;
  room?: string;
  schedule?: Record<string, unknown>;
  capacity?: number;
  academicYear?: string;
}

export interface UpdateClassDto extends Partial<CreateClassDto> {
  status?: 'active' | 'inactive' | 'archived';
}

// Enrollment
export interface Enrollment extends BaseEntity {
  tenantId: string;
  studentId: string;
  classId: string;
  enrollmentDate: string;
  status: 'active' | 'completed' | 'withdrawn';
}

export interface CreateEnrollmentDto {
  studentId: string;
  classId: string;
  enrollmentDate: string;
}

export interface UpdateEnrollmentDto {
  status?: 'active' | 'completed' | 'withdrawn';
}

// Assignment
export interface Assignment extends BaseEntity {
  tenantId: string;
  classId: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: number;
  status: 'draft' | 'published' | 'closed';
}

export interface CreateAssignmentDto {
  classId: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: number;
}

export interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {
  status?: 'draft' | 'published' | 'closed';
}

// Announcement
export interface Announcement extends BaseEntity {
  tenantId: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string;
  targetAudience?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string;
  targetAudience?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateAnnouncementDto extends Partial<CreateAnnouncementDto> {
  status?: 'draft' | 'published' | 'archived';
}

// Attendance
export interface Attendance extends BaseEntity {
  tenantId: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface CreateAttendanceDto {
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface UpdateAttendanceDto extends Partial<CreateAttendanceDto> {}

// Calendar Event
export interface CalendarEvent extends BaseEntity {
  tenantId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  eventType: 'holiday' | 'exam' | 'meeting' | 'event' | 'other';
  location?: string;
  participants?: string[];
}

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  eventType: 'holiday' | 'exam' | 'meeting' | 'event' | 'other';
  location?: string;
  participants?: string[];
}

export interface UpdateCalendarEventDto extends Partial<CreateCalendarEventDto> {}

// Fee Status
export interface FeeStatus extends BaseEntity {
  tenantId: string;
  studentId: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  status: 'paid' | 'partial' | 'overdue' | 'waived';
  notes?: string;
}

export interface CreateFeeStatusDto {
  studentId: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  notes?: string;
}

export interface UpdateFeeStatusDto extends Partial<CreateFeeStatusDto> {
  status?: 'paid' | 'partial' | 'overdue' | 'waived';
}

// Household
export interface Household extends BaseEntity {
  tenantId: string;
  name: string;
  address?: string;
  primaryContact?: string;
  phone?: string;
  email?: string;
  students?: string[]; // Student IDs
  parents?: string[]; // Parent IDs
}

export interface CreateHouseholdDto {
  name: string;
  address?: string;
  primaryContact?: string;
  phone?: string;
  email?: string;
  students?: string[];
  parents?: string[];
}

export interface UpdateHouseholdDto extends Partial<CreateHouseholdDto> {}

// Assessment
export type AssessmentType = 'CA1' | 'CA2' | 'CA3' | 'EXAM' | 'PROJECT' | 'PRACTICAL';

export interface Assessment extends BaseEntity {
  termId: string;
  subjectId: string;
  type: AssessmentType;
  weight: number; // Percentage weight (e.g., 10, 20, 70)
  maxScore: number;
  term?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
  };
  grades?: Grade[];
}

export interface CreateAssessmentDto {
  termId: string;
  subjectId: string;
  type: AssessmentType;
  weight: number;
  maxScore: number;
}

export interface UpdateAssessmentDto extends Partial<CreateAssessmentDto> {}

// Grade
export interface Grade extends BaseEntity {
  assessmentId: string;
  studentId: string;
  score: number;
  remarks?: string;
  assessment?: Assessment;
  student?: Student;
}

export interface CreateGradeDto {
  assessmentId: string;
  studentId: string;
  score: number;
  remarks?: string;
}

export interface UpdateGradeDto extends Partial<CreateGradeDto> {}

// Subject
export interface Subject extends BaseEntity {
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
}

// Term
export interface Term extends BaseEntity {
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYear: string;
}

// Query/List response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}
