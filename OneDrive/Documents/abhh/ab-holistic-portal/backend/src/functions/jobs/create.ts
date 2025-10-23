import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { UserRole, JobStatus, JobType, RemotePolicy, CreateJobRequest, Job } from '../../types';
import { validateCreateJobRequest } from '../../utils/validation';

const logger = new Logger('JobCreate');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Create Job Handler
 *
 * SECURITY: This endpoint requires authentication via JWT token
 * - Only admins and super admins can create jobs
 * - Comprehensive validation of all input fields
 * - Proper error handling and response formatting
 * - Data consistency with frontend expectations
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
    // Extract origin header for CORS
    const requestOrigin = event.headers['origin'] || event.headers['Origin'];

    logger.info('Job creation request received', {
        requestId: context.awsRequestId,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.headers['User-Agent'],
        origin: requestOrigin
    });

    try {
        // CRITICAL SECURITY: Verify user authentication from authorizer
        const authContext = event.requestContext?.authorizer;
        if (!authContext || !authContext.principalId) {
            logger.warn('Unauthorized job creation attempt', {
                sourceIp: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent']
            });
            return createResponse(401, {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required to create jobs'
                }
            }, {}, true, requestOrigin);
        }

        const userId = authContext.userId || authContext.principalId;
        const userRole = authContext.role as UserRole;
        const userEmail = authContext.email;

        // SECURITY: Only admins can create jobs
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
            logger.warn('Non-admin user attempting to create job', {
                userId,
                userRole,
                userEmail
            });
            return createResponse(403, {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only administrators can create jobs'
                }
            }, {}, true, requestOrigin);
        }

        // Parse and validate request body
        let requestBody: CreateJobRequest;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            logger.warn('Invalid JSON in request body', {
                userId,
                parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
            });
            return createResponse(400, {
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Invalid JSON in request body'
                }
            }, {}, true, requestOrigin);
        }

        // Comprehensive validation using Joi schema
        const validationResult = validateCreateJobRequest(requestBody);
        if (!validationResult.isValid) {
            logger.warn('Invalid job creation request', {
                userId,
                validationErrors: validationResult.errors
            });
            return createResponse(400, {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid job data provided',
                    details: validationResult.errors
                }
            }, {}, true, requestOrigin);
        }

        const validatedData = validationResult.data as CreateJobRequest;

        logger.info('Authenticated admin creating job', {
            userId,
            userRole,
            userEmail,
            jobTitle: validatedData.title
        });

        const now = new Date().toISOString();
        const jobId = uuidv4();

        // Create comprehensive job object with proper typing
        const job: Job = {
            jobId,
            title: validatedData.title.trim(),
            description: validatedData.description.trim(),
            requirements: validatedData.requirements || [],
            responsibilities: validatedData.responsibilities || [],
            qualifications: validatedData.qualifications || [],
            department: validatedData.department?.trim() || 'General',
            location: validatedData.location?.trim() || 'Remote',
            remotePolicy: validatedData.remotePolicy || RemotePolicy.REMOTE,
            jobType: validatedData.jobType || JobType.FULL_TIME,
            status: JobStatus.DRAFT, // Start as draft, can be published later
            salaryRange: validatedData.salaryRange || undefined,
            benefits: validatedData.benefits || [],
            skills: validatedData.skills || [],
            experienceLevel: validatedData.experienceLevel || 'mid',
            applicationDeadline: validatedData.applicationDeadline || undefined,
            startDate: validatedData.startDate || undefined,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            applicationCount: 0,
            viewCount: 0,
            tags: validatedData.tags || []
        };

        // Add EntityType for DynamoDB compatibility
        const jobEntity = {
            ...job,
            EntityType: 'Job'
        };

        // Save to DynamoDB
        const tableName = process.env.JOBS_TABLE;
        if (!tableName) {
            logger.error('JOBS_TABLE environment variable not configured');
            return createResponse(500, {
                success: false,
                error: {
                    code: 'CONFIGURATION_ERROR',
                    message: 'Database configuration error'
                }
            }, {}, true, requestOrigin);
        }

        logger.info('Saving job to database', {
            tableName,
            jobId,
            userId,
            jobTitle: job.title
        });

        const params = {
            TableName: tableName,
            Item: jobEntity,
            ConditionExpression: 'attribute_not_exists(jobId)'
        };

        await dynamodb.send(new PutCommand(params));

        logger.info('Job created successfully', {
            jobId,
            jobTitle: job.title,
            jobStatus: job.status,
            userId,
            userRole
        });

        // Transform job for frontend response
        const transformedJob = {
            id: job.jobId,
            title: job.title,
            description: job.description,
            department: job.department,
            location: job.location,
            type: job.jobType,
            requirements: job.requirements,
            responsibilities: job.responsibilities,
            qualifications: job.qualifications,
            benefits: job.benefits,
            skills: job.skills,
            remotePolicy: job.remotePolicy,
            experienceLevel: job.experienceLevel,
            salaryRange: job.salaryRange,
            applicationDeadline: job.applicationDeadline,
            startDate: job.startDate,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            status: job.status,
            applicationCount: job.applicationCount,
            viewCount: job.viewCount,
            tags: job.tags,
            createdBy: job.createdBy
        };

        return createResponse(201, {
            success: true,
            data: {
                job: transformedJob
            },
            message: 'Job created successfully'
        }, {}, true, requestOrigin);

    } catch (error) {
        logger.error('Failed to create job', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            userId: event.requestContext?.authorizer?.userId,
            userRole: event.requestContext?.authorizer?.role
        });

        // Handle specific DynamoDB errors
        if (error && typeof error === 'object' && 'name' in error && error.name === 'ConditionalCheckFailedException') {
            return createResponse(409, {
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: 'Job with this ID already exists'
                }
            }, {}, true, requestOrigin);
        }

        return createResponse(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create job'
            }
        }, {}, true, requestOrigin);
    }
};

export default handler;