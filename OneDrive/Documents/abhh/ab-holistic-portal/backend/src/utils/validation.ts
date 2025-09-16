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
  jobStatus: Joi.string().valid('draft', 'published', 'closed').required(),
  testType: Joi.string().valid('written', 'video').required(),
  questionType: Joi.string().valid('mcq', 'short_answer', 'essay', 'video_prompt').required(),
};

// Job validation schemas
export const jobSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(5000).required(),
    requirements: Joi.array().items(Joi.string().min(3).max(200)).min(1).max(20).required(),
    deadline: Joi.date().iso().greater('now').optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().min(10).max(5000).optional(),
    requirements: Joi.array().items(Joi.string().min(3).max(200)).min(1).max(20).optional(),
    deadline: Joi.date().iso().greater('now').optional(),
    status: commonSchemas.jobStatus.optional(),
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

// Validation helper functions
export const validateSchema = (schema: Joi.ObjectSchema, data: unknown) => {
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

  return value;
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