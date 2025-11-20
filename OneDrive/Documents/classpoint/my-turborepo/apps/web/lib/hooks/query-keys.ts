/**
 * Query Key Factory
 * Centralized query key management for React Query
 * Following best practices from TanStack Query docs
 */

import type { QueryParams } from '../types/entities';

export const queryKeys = {
  // Tenants
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.tenants.lists(), params] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
  },

  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.students.lists(), params] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },

  // Teachers
  teachers: {
    all: ['teachers'] as const,
    lists: () => [...queryKeys.teachers.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.teachers.lists(), params] as const,
    details: () => [...queryKeys.teachers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teachers.details(), id] as const,
  },

  // Parents
  parents: {
    all: ['parents'] as const,
    lists: () => [...queryKeys.parents.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.parents.lists(), params] as const,
    details: () => [...queryKeys.parents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.parents.details(), id] as const,
  },

  // Classes
  classes: {
    all: ['classes'] as const,
    lists: () => [...queryKeys.classes.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.classes.lists(), params] as const,
    details: () => [...queryKeys.classes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classes.details(), id] as const,
  },

  // Enrollments
  enrollments: {
    all: ['enrollments'] as const,
    lists: () => [...queryKeys.enrollments.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.enrollments.lists(), params] as const,
    details: () => [...queryKeys.enrollments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.enrollments.details(), id] as const,
    byClass: (classId: string) => [...queryKeys.enrollments.all, 'class', classId] as const,
    byStudent: (studentId: string) => [...queryKeys.enrollments.all, 'student', studentId] as const,
  },

  // Assignments
  assignments: {
    all: ['assignments'] as const,
    lists: () => [...queryKeys.assignments.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.assignments.lists(), params] as const,
    details: () => [...queryKeys.assignments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assignments.details(), id] as const,
    byClass: (classId: string) => [...queryKeys.assignments.all, 'class', classId] as const,
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    lists: () => [...queryKeys.announcements.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.announcements.lists(), params] as const,
    details: () => [...queryKeys.announcements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.announcements.details(), id] as const,
  },

  // Attendance
  attendance: {
    all: ['attendance'] as const,
    lists: () => [...queryKeys.attendance.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.attendance.lists(), params] as const,
    details: () => [...queryKeys.attendance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.attendance.details(), id] as const,
    byClass: (classId: string, date: string) => [...queryKeys.attendance.all, 'class', classId, date] as const,
    byStudent: (studentId: string) => [...queryKeys.attendance.all, 'student', studentId] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    lists: () => [...queryKeys.calendar.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.calendar.lists(), params] as const,
    details: () => [...queryKeys.calendar.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calendar.details(), id] as const,
    byDate: (date: string) => [...queryKeys.calendar.all, 'date', date] as const,
  },

  // Fee Status
  feeStatus: {
    all: ['feeStatus'] as const,
    lists: () => [...queryKeys.feeStatus.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.feeStatus.lists(), params] as const,
    details: () => [...queryKeys.feeStatus.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.feeStatus.details(), id] as const,
    byStudent: (studentId: string) => [...queryKeys.feeStatus.all, 'student', studentId] as const,
  },

  // Households
  households: {
    all: ['households'] as const,
    lists: () => [...queryKeys.households.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.households.lists(), params] as const,
    details: () => [...queryKeys.households.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.households.details(), id] as const,
    byParent: (parentId: string) => [...queryKeys.households.all, 'parent', parentId] as const,
  },

  // Assessments
  assessments: {
    all: ['assessments'] as const,
    lists: () => [...queryKeys.assessments.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.assessments.lists(), params] as const,
    details: () => [...queryKeys.assessments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assessments.details(), id] as const,
    byTerm: (termId: string) => [...queryKeys.assessments.all, 'term', termId] as const,
    bySubject: (subjectId: string) => [...queryKeys.assessments.all, 'subject', subjectId] as const,
  },

  // Grades
  grades: {
    all: ['grades'] as const,
    lists: () => [...queryKeys.grades.all, 'list'] as const,
    list: (params?: QueryParams) => [...queryKeys.grades.lists(), params] as const,
    details: () => [...queryKeys.grades.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.grades.details(), id] as const,
    byAssessment: (assessmentId: string) => [...queryKeys.grades.all, 'assessment', assessmentId] as const,
    byStudent: (studentId: string) => [...queryKeys.grades.all, 'student', studentId] as const,
  },
};
