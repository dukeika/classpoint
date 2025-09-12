// File: src/lib/validations/applicationSchemas.ts
import { z } from 'zod';

export const createApplicationSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  jobId: z.string().min(1, 'Job ID is required'),
  appliedAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  currentStage: z.number().int().min(1).max(4).default(1),
  overallStatus: z.enum(['ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN']).default('ACTIVE'),
  applicationStatus: z.enum(['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SCHEDULED']).default('COMPLETED'),
  writtenTestStatus: z.enum(['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SCHEDULED']).default('NOT_STARTED'),
  videoTestStatus: z.enum(['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SCHEDULED']).default('NOT_STARTED'),
  interviewStatus: z.enum(['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SCHEDULED']).default('NOT_STARTED'),
  feedback: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  id: z.string().min(1, 'Application ID is required'),
});

export const applicationProgressSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  newStage: z.number().int().min(1).max(4),
  status: z.enum(['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SCHEDULED']),
  feedback: z.string().optional(),
  score: z.number().optional(),
});

export const applicationFilterSchema = z.object({
  candidateId: z.string().optional(),
  jobId: z.string().optional(),
  companyId: z.string().optional(),
  currentStage: z.number().int().min(1).max(4).optional(),
  overallStatus: z.enum(['ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationProgressInput = z.infer<typeof applicationProgressSchema>;
export type ApplicationFilter = z.infer<typeof applicationFilterSchema>;