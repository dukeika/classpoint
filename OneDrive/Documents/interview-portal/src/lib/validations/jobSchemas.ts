// File: src/lib/validations/jobSchemas.ts
import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(100, 'Title too long'),
  department: z.string().min(1, 'Department is required').max(50, 'Department too long'),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'], {
    required_error: 'Job type is required',
  }),
  salary: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  requirements: z.array(z.string().min(1, 'Requirement cannot be empty')).min(1, 'At least one requirement is needed'),
  responsibilities: z.array(z.string().min(1, 'Responsibility cannot be empty')).min(1, 'At least one responsibility is needed'),
  benefits: z.array(z.string().min(1, 'Benefit cannot be empty')).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).default('ACTIVE'),
  closingDate: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
});

export const updateJobSchema = createJobSchema.partial().extend({
  id: z.string().min(1, 'Job ID is required'),
});

export const jobFilterSchema = z.object({
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFilter = z.infer<typeof jobFilterSchema>;