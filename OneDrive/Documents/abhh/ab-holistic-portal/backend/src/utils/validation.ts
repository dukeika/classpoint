import Joi from 'joi';

// Common validation schemas
export const commonSchemas = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  uuid: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s'-]+$/).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  url: Joi.string().uri().optional(),
  stage: Joi.string().valid('applied', 'written_test', 'video_test', 'final_interview', 'hired', 'rejected').required(),
  jobStatus: Joi.string().valid('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED').required(),
  testType: Joi.string().valid('written', 'video').required(),
  questionType: Joi.string().valid('mcq', 'short_answer', 'essay', 'video_prompt').required(),
};

// Job validation schemas
export const jobSchemas = {
  create: Joi.object({
    // Required fields
    title: Joi.string().min(3).max(100).trim().required(),
    description: Joi.string().min(10).max(5000).trim().required(),
    requirements: Joi.array().items(Joi.string().min(3).max(200).trim()).min(1).max(20).required(),

    // Optional fields with comprehensive validation
    responsibilities: Joi.array().items(Joi.string().min(3).max(200).trim()).max(20).optional().default([]),
    qualifications: Joi.array().items(Joi.string().min(3).max(200).trim()).max(20).optional().default([]),
    department: Joi.string().min(2).max(50).trim().optional().default('General'),
    location: Joi.string().min(2).max(100).trim().optional().default('Remote'),
    remotePolicy: Joi.string().valid('remote', 'hybrid', 'on_site', 'REMOTE', 'HYBRID', 'ON_SITE').optional().default('remote'),
    jobType: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'freelance', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE').optional().default('full_time'),
    employmentType: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'freelance', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE').optional(), // legacy alias
    type: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'freelance', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance').optional(), // frontend compatibility
    status: Joi.string().valid('draft', 'published', 'closed', 'archived', 'DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED').optional().default('draft'),
    salaryRange: Joi.object({
      min: Joi.number().positive().optional(),
      max: Joi.number().positive().optional(),
      currency: Joi.string().length(3).uppercase().optional().default('USD')
    }).optional(),
    salary: Joi.string().max(100).optional(), // legacy alias for simple salary string
    benefits: Joi.array().items(Joi.string().max(100).trim()).max(20).optional().default([]),
    skills: Joi.array().items(Joi.string().max(50).trim()).max(30).optional().default([]),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'principal', 'junior', 'executive').optional().default('mid'),
    applicationDeadline: Joi.date().iso().greater('now').optional(),
    deadline: Joi.date().iso().greater('now').optional(), // legacy alias
    startDate: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string().max(30).trim()).max(10).optional().default([]),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100).trim().optional(),
    description: Joi.string().min(10).max(5000).trim().optional(),
    requirements: Joi.array().items(Joi.string().min(3).max(200).trim()).min(1).max(20).optional(),
    responsibilities: Joi.array().items(Joi.string().min(3).max(200).trim()).max(20).optional(),
    qualifications: Joi.array().items(Joi.string().min(3).max(200).trim()).max(20).optional(),
    department: Joi.string().min(2).max(50).trim().optional(),
    location: Joi.string().min(2).max(100).trim().optional(),
    remotePolicy: Joi.string().valid('remote', 'hybrid', 'on_site', 'REMOTE', 'HYBRID', 'ON_SITE').optional(),
    jobType: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'freelance', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE').optional(),
    type: Joi.string().valid('full_time', 'part_time', 'contract', 'internship', 'freelance', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance').optional(), // frontend compatibility
    status: Joi.string().valid('draft', 'published', 'closed', 'archived', 'DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED').optional(),
    salaryRange: Joi.object({
      min: Joi.number().positive().optional(),
      max: Joi.number().positive().optional(),
      currency: Joi.string().length(3).uppercase().optional().default('USD')
    }).optional(),
    salary: Joi.string().max(100).optional(), // legacy alias
    benefits: Joi.array().items(Joi.string().max(100).trim()).max(20).optional(),
    skills: Joi.array().items(Joi.string().max(50).trim()).max(30).optional(),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'principal', 'junior', 'executive').optional(),
    applicationDeadline: Joi.date().iso().greater('now').optional(),
    startDate: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string().max(30).trim()).max(10).optional(),
  }),
};

// Applicant validation schemas
export const applicantSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    phone: commonSchemas.phone,
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),

  profile: Joi.object({
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone,
  }),
};

// Application validation schemas
export const applicationSchemas = {
  create: Joi.object({
    jobId: commonSchemas.uuid,
    coverLetter: Joi.string().min(50).max(2000).required(),
    resumeUrl: commonSchemas.url,
  }),

  updateStage: Joi.object({
    stage: commonSchemas.stage,
    adminComments: Joi.string().max(1000).optional(),
    rejectionReason: Joi.string().max(500).optional(),
  }),
};

// Test validation schemas
export const testSchemas = {
  create: Joi.object({
    jobId: commonSchemas.uuid,
    type: commonSchemas.testType,
    title: Joi.string().min(3).max(100).required(),
    instructions: Joi.string().min(10).max(2000).required(),
    timeLimit: Joi.number().integer().min(15).max(180).required(),
    questions: Joi.array().items(
      Joi.object({
        type: commonSchemas.questionType,
        text: Joi.string().min(10).max(1000).required(),
        options: Joi.array().items(Joi.string().max(200)).when('type', {
          is: 'mcq',
          then: Joi.array().min(2).max(6).required(),
          otherwise: Joi.optional(),
        }),
        correctAnswer: Joi.alternatives().try(
          Joi.string(),
          Joi.array().items(Joi.string())
        ).optional(),
        points: Joi.number().integer().min(1).max(100).default(1),
        timeLimit: Joi.number().integer().min(30).max(600).when('type', {
          is: 'video_prompt',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        required: Joi.boolean().default(true),
        orderIndex: Joi.number().integer().min(0).required(),
      })
    ).min(1).max(50).required(),
  }),

  submit: Joi.object({
    answers: Joi.array().items(
      Joi.object({
        questionId: commonSchemas.uuid,
        response: Joi.alternatives().try(
          Joi.string().max(5000),
          Joi.array().items(Joi.string().max(5000))
        ).required(),
        timeSpent: Joi.number().integer().min(0).optional(),
        submittedAt: Joi.date().iso().required(),
        metadata: Joi.object({
          videoUrl: commonSchemas.url,
          videoDuration: Joi.number().positive().optional(),
          audioQuality: Joi.number().min(0).max(10).optional(),
          videoQuality: Joi.number().min(0).max(10).optional(),
          deviceInfo: Joi.string().max(200).optional(),
          browserInfo: Joi.string().max(200).optional(),
        }).optional(),
      })
    ).min(1).required(),
    timeSpent: Joi.number().integer().min(0).required(),
  }),
};

// File upload validation schemas
export const fileSchemas = {
  uploadUrl: Joi.object({
    fileName: Joi.string().min(1).max(255).required(),
    fileType: Joi.string().valid(
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/webm',
      'video/mp4',
      'video/quicktime'
    ).required(),
    fileSize: Joi.number().integer().min(1).max(100 * 1024 * 1024).required(), // 100MB max
    context: Joi.string().valid('resume', 'video', 'other').required(),
  }),
};

// Notification validation schemas
export const notificationSchemas = {
  send: Joi.object({
    recipientId: commonSchemas.uuid,
    recipientType: Joi.string().valid('applicant', 'admin').required(),
    type: Joi.string().valid('email', 'sms', 'push').required(),
    subject: Joi.string().min(1).max(200).required(),
    body: Joi.string().min(1).max(5000).required(),
    metadata: Joi.object().optional(),
  }),
};

// Validation helper functions with improved typing
export const validateSchema = <T>(schema: Joi.ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });

  if (error) {
    const details = error.details.reduce((acc, curr) => {
      acc[curr.path.join('.')] = curr.message;
      return acc;
    }, {} as Record<string, string>);

    throw new ValidationError('Validation failed', details);
  }

  return value as T;
};

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const htmlEntities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return htmlEntities[match] || match;
    });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Generic validation interface for request validation
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function validateRequest<T = any>(
  body: string | null,
  rules: Record<string, ValidationRule>
): ValidationResult<T> {
  try {
    // Parse body if it's a string
    let data: any;
    if (typeof body === 'string') {
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        return {
          isValid: false,
          errors: { body: 'Invalid JSON format' }
        };
      }
    } else if (body === null) {
      data = {};
    } else {
      data = body;
    }

    const errors: Record<string, string> = {};

    // Validate each field according to rules
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation if field is not required and not present
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const isValidType = validateType(value, rule.type);
        if (!isValidType) {
          errors[field] = `${field} must be of type ${rule.type}`;
          continue;
        }
      }

      // String-specific validations
      if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors[field] = `${field} must be at least ${rule.minLength} characters`;
          continue;
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors[field] = `${field} must be no more than ${rule.maxLength} characters`;
          continue;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
          continue;
        }
      }

      // Number-specific validations
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
          continue;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors[field] = `${field} must be no more than ${rule.max}`;
          continue;
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rule.enum.join(', ')}`;
        continue;
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors[field] = typeof customResult === 'string' ? customResult : `${field} is invalid`;
          continue;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: data as T
    };

  } catch (error) {
    return {
      isValid: false,
      errors: {
        general: error instanceof Error ? error.message : 'Validation failed'
      }
    };
  }
}

function validateType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'email':
      return typeof value === 'string' && validateEmail(value);
    case 'uuid':
      return typeof value === 'string' && validateUUID(value);
    default:
      return true;
  }
}

// Additional job-specific validation functions
export const validateJobId = (jobId: string): boolean => {
  return typeof jobId === 'string' && jobId.length > 0 && validateUUID(jobId);
};

/**
 * Validate job status transition
 */
export const validateJobStatusTransition = (
  currentStatus: string,
  newStatus: string
): { isValid: boolean; error?: string } => {
  const validTransitions: Record<string, string[]> = {
    draft: ['published', 'archived'],
    published: ['closed', 'archived'],
    closed: ['published', 'archived'],
    archived: [] // Cannot transition from archived
  };

  const normalizedCurrent = currentStatus.toLowerCase();
  const normalizedNew = newStatus.toLowerCase();

  if (!validTransitions[normalizedCurrent]) {
    return {
      isValid: false,
      error: `Invalid current status: ${currentStatus}`
    };
  }

  if (!validTransitions[normalizedCurrent].includes(normalizedNew)) {
    return {
      isValid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { isValid: true };
};

/**
 * Transform job object for consistent API response
 */
export const transformJobForResponse = (job: any): any => {
  if (!job) return job;

  return {
    id: job.jobId || job.id,
    title: job.title,
    description: job.description || '',
    department: job.department || 'General',
    location: job.location || 'Remote',
    type: job.jobType || job.type || 'full_time',
    requirements: Array.isArray(job.requirements) ? job.requirements : (job.requirements ? [job.requirements] : []),
    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : (job.responsibilities ? [job.responsibilities] : []),
    qualifications: Array.isArray(job.qualifications) ? job.qualifications : (job.qualifications ? [job.qualifications] : []),
    benefits: Array.isArray(job.benefits) ? job.benefits : (job.benefits ? [job.benefits] : []),
    skills: Array.isArray(job.skills) ? job.skills : (job.skills ? [job.skills] : []),
    remotePolicy: job.remotePolicy || 'remote',
    experienceLevel: job.experienceLevel || 'mid',
    salaryRange: job.salaryRange || null,
    applicationDeadline: job.applicationDeadline || null,
    startDate: job.startDate || null,
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
    status: job.status || 'draft',
    applicationCount: job.applicationCount || 0,
    viewCount: job.viewCount || 0,
    tags: Array.isArray(job.tags) ? job.tags : [],
    createdBy: job.createdBy,
    publishedAt: job.publishedAt,
    closedAt: job.closedAt
  };
};

export const validateUpdateJobRequest = (request: any): ValidationResult => {
  try {
    // Normalize field names before validation
    const normalizedRequest = normalizeJobRequest(request);

    // Use Joi schema for thorough validation
    const { error, value } = jobSchemas.update.validate(normalizedRequest, {
      stripUnknown: true,
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.reduce((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {} as Record<string, string>);

      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: value
    };

  } catch (validationError) {
    return {
      isValid: false,
      errors: {
        general: validationError instanceof Error ? validationError.message : 'Validation failed'
      }
    };
  }
};

/**
 * Normalize job request to handle various frontend field name formats
 */
export const normalizeJobRequest = (request: any): any => {
  if (!request || typeof request !== 'object') {
    return request;
  }

  const normalized = { ...request };

  // Handle legacy/frontend field name mappings
  if (request.type && !request.jobType) {
    normalized.jobType = request.type;
  }
  if (request.employmentType && !request.jobType) {
    normalized.jobType = request.employmentType;
  }
  if (request.deadline && !request.applicationDeadline) {
    normalized.applicationDeadline = request.deadline;
  }
  if (request.salary && !request.salaryRange && typeof request.salary === 'string') {
    // Convert simple salary string to object if needed
    normalized.salaryRange = { min: 0, max: 0, currency: 'USD' };
  }

  // Normalize enum values to lowercase
  if (normalized.jobType) {
    normalized.jobType = normalized.jobType.toLowerCase();
  }
  if (normalized.remotePolicy) {
    normalized.remotePolicy = normalized.remotePolicy.toLowerCase();
  }
  if (normalized.status) {
    normalized.status = normalized.status.toLowerCase();
  }
  if (normalized.experienceLevel) {
    normalized.experienceLevel = normalized.experienceLevel.toLowerCase();
  }

  // Ensure arrays are properly formatted
  const arrayFields = ['requirements', 'responsibilities', 'qualifications', 'benefits', 'skills', 'tags'];
  arrayFields.forEach(field => {
    if (normalized[field] && !Array.isArray(normalized[field])) {
      if (typeof normalized[field] === 'string') {
        // Split comma-separated strings into arrays
        normalized[field] = normalized[field].split(',').map((item: string) => item.trim()).filter(Boolean);
      } else {
        // Convert single item to array
        normalized[field] = [normalized[field]];
      }
    }
  });

  // Remove undefined/null values
  Object.keys(normalized).forEach(key => {
    if (normalized[key] === undefined || normalized[key] === null) {
      delete normalized[key];
    }
  });

  return normalized;
};

export const validateCreateJobRequest = (request: any): ValidationResult => {
  try {
    // Normalize field names before validation
    const normalizedRequest = normalizeJobRequest(request);

    // Use Joi schema for thorough validation
    const { error, value } = jobSchemas.create.validate(normalizedRequest, {
      stripUnknown: true,
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.reduce((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {} as Record<string, string>);

      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: value
    };

  } catch (validationError) {
    return {
      isValid: false,
      errors: {
        general: validationError instanceof Error ? validationError.message : 'Validation failed'
      }
    };
  }
};