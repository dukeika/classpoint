import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, corsPreflightResponse } from '../../utils/response';
import { validateSchema, jobSchemas } from '../../utils/validation';
import { DatabaseService } from '../../services/database';
import { JobStatus, JobType, RemotePolicy, Permission } from '../../types';
import { Logger } from '../../utils/logger';
import { ErrorHandler } from '../../utils/errors';

const logger = new Logger('CreateJobFunction');
const dbService = DatabaseService.getInstance();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context) => {
  // Extract request origin for CORS (needs to be outside try block for error handling)
  const requestOrigin = event.headers?.origin || event.headers?.Origin || event.headers?.['Origin'];

  try {
    // Initialize logger with request context
    logger.setRequestContext(context.awsRequestId, undefined, undefined, context.awsRequestId);
    logger.info('Processing job creation request');

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse(requestOrigin);
    }

    // Extract user context from authorizer
    const userContext = event.requestContext?.authorizer;
    logger.info('User context from authorizer', {
      hasContext: !!userContext,
      userId: userContext?.userId,
      role: userContext?.role,
      permissions: userContext?.permissions,
      fullContext: userContext
    });

    if (!userContext || !userContext.userId) {
      logger.warn('Missing user context in request', {
        requestContext: event.requestContext,
        authorizer: event.requestContext?.authorizer
      });
      return forbiddenResponse('Authorization required to create jobs', requestOrigin);
    }

    // Set user ID in logger
    logger.setRequestContext(context.awsRequestId, userContext.userId, undefined, context.awsRequestId);

    // Check if user has permission to create jobs
    let permissions: string[] = [];
    try {
      permissions = JSON.parse(userContext.permissions || '[]');
    } catch (error) {
      logger.warn('Failed to parse user permissions', { permissions: userContext.permissions, error });
      permissions = [];
    }

    logger.info('Checking user permissions for job creation', {
      userId: userContext.userId,
      userRole: userContext.role,
      parsedPermissions: permissions,
      requiredPermission: Permission.CREATE_JOB,
      hasPermission: permissions.includes(Permission.CREATE_JOB)
    });

    // Check both permission and role for additional validation
    const isAdmin = userContext.role === 'admin' || userContext.role === 'super_admin';
    const hasCreatePermission = permissions.includes(Permission.CREATE_JOB);

    if (!hasCreatePermission && !isAdmin) {
      logger.warn('User lacks permission to create jobs', {
        userId: userContext.userId,
        role: userContext.role,
        permissions: permissions,
        isAdmin,
        hasCreatePermission
      });
      return forbiddenResponse('Insufficient permissions to create jobs', requestOrigin);
    }

    // Parse and validate request body
    if (!event.body) {
      logger.warn('Request body is empty');
      return validationErrorResponse('Request body is required', {}, requestOrigin);
    }

    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      logger.warn('Failed to parse request body as JSON', { body: event.body, error });
      return validationErrorResponse('Invalid JSON in request body', { error: 'Invalid JSON format' }, requestOrigin);
    }

    const validatedData = validateSchema(jobSchemas.create, body);

    // Create job record
    const jobId = dbService.generateId();
    const now = dbService.getTimestamp();

    const jobData = {
      // DynamoDB keys
      jobId,

      // Job basic information
      title: validatedData.title,
      description: validatedData.description,
      requirements: validatedData.requirements,

      // Optional fields with defaults
      responsibilities: validatedData.responsibilities || [],
      qualifications: validatedData.qualifications || [],
      department: validatedData.department || 'General',
      location: validatedData.location || 'Remote',
      remotePolicy: validatedData.remotePolicy || RemotePolicy.REMOTE,
      jobType: validatedData.jobType || validatedData.employmentType || JobType.FULL_TIME,
      status: validatedData.status || JobStatus.DRAFT,

      // Salary and benefits
      salaryRange: validatedData.salaryRange || validatedData.salary,
      benefits: validatedData.benefits || [],

      // Skills and experience
      skills: validatedData.skills || [],
      experienceLevel: validatedData.experienceLevel || 'mid',

      // Dates
      applicationDeadline: validatedData.applicationDeadline || validatedData.deadline,
      startDate: validatedData.startDate,

      // Metadata
      createdBy: userContext.userId,
      createdAt: now,
      updatedAt: now,
      tags: validatedData.tags || [],

      // Counters
      applicationCount: 0,
      viewCount: 0,

      // Entity type for DynamoDB
      EntityType: 'Job'
    };

    // Validate required environment variables
    const jobsTable = process.env.JOBS_TABLE;
    if (!jobsTable) {
      logger.error('JOBS_TABLE environment variable not set');
      throw new Error('Database configuration error');
    }

    logger.debug('Creating job in database', { table: jobsTable, jobId, title: validatedData.title });

    // Save job to database
    const createdJob = await dbService.putItem(
      jobsTable,
      jobData,
      'attribute_not_exists(jobId)'
    );

    logger.info('Job created successfully', {
      jobId,
      title: validatedData.title,
      createdBy: userContext.userId,
      userRole: userContext.role
    });

    // Return sanitized job data (remove internal DynamoDB keys)
    const responseJob = {
      jobId: createdJob.jobId,
      title: createdJob.title,
      description: createdJob.description,
      requirements: createdJob.requirements,
      responsibilities: createdJob.responsibilities,
      qualifications: createdJob.qualifications,
      department: createdJob.department,
      location: createdJob.location,
      remotePolicy: createdJob.remotePolicy,
      jobType: createdJob.jobType,
      status: createdJob.status,
      salaryRange: createdJob.salaryRange,
      benefits: createdJob.benefits,
      skills: createdJob.skills,
      experienceLevel: createdJob.experienceLevel,
      applicationDeadline: createdJob.applicationDeadline,
      startDate: createdJob.startDate,
      createdBy: createdJob.createdBy,
      createdAt: createdJob.createdAt,
      updatedAt: createdJob.updatedAt,
      tags: createdJob.tags,
      applicationCount: createdJob.applicationCount,
      viewCount: createdJob.viewCount
    };

    return successResponse(responseJob, 'Job created successfully', 201, requestOrigin);

  } catch (error) {
    logger.error('Job creation error:', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });

    // Handle validation errors specifically
    if (error instanceof Error && error.name === 'ValidationError') {
      return validationErrorResponse(error.message, (error as any).details, requestOrigin);
    }

    // Use centralized error handling for other errors
    return ErrorHandler.handleError(error, context.awsRequestId, userContext?.userId, undefined, requestOrigin);
  }
};