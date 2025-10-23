import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { UserRole } from '../../types';
import { validateJobId, transformJobForResponse } from '../../utils/validation';

const logger = new Logger('JobGet');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Get Job Handler
 *
 * SECURITY: This endpoint requires authentication via JWT token
 * - Admins can view any job (including drafts)
 * - Applicants can only view published/active jobs
 * - Non-existent jobs return 404
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
    logger.info('Job retrieval request received', {
        requestId: context.awsRequestId,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.headers['User-Agent']
    });

    try {
        // CRITICAL SECURITY: Verify user authentication from authorizer
        const authContext = event.requestContext?.authorizer;
        if (!authContext || !authContext.principalId) {
            logger.warn('Unauthorized job access attempt', {
                sourceIp: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent']
            });
            return createResponse(401, {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required to access job details'
                }
            });
        }

        const userId = authContext.userId;
        const userRole = authContext.role as UserRole;
        const userEmail = authContext.email;

        // Validate job ID parameter
        const jobId = event.pathParameters?.id;
        if (!jobId || !validateJobId(jobId)) {
            logger.warn('Invalid job ID provided', {
                jobId,
                userId,
                userRole
            });
            return createResponse(400, {
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Valid job ID is required'
                }
            });
        }

        logger.info('Authenticated user requesting job', {
            userId,
            userRole,
            userEmail,
            jobId
        });

        // Get job from DynamoDB
        const tableName = process.env.JOBS_TABLE;
        if (!tableName) {
            logger.error('JOBS_TABLE environment variable not configured');
            return createResponse(500, {
                success: false,
                error: {
                    code: 'CONFIGURATION_ERROR',
                    message: 'Database configuration error'
                }
            });
        }

        logger.info('Querying job from database', { tableName, jobId });

        const params = {
            TableName: tableName,
            Key: {
                jobId: jobId
            }
        };

        const result = await dynamodb.send(new GetCommand(params));

        if (!result.Item) {
            logger.warn('Job not found', { jobId, userId, userRole });
            return createResponse(404, {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }

        const job = result.Item;

        // SECURITY: Apply role-based access control
        if (userRole === UserRole.APPLICANT) {
            // Applicants can only view active/published jobs
            if (job.status !== 'ACTIVE' && job.status !== 'PUBLISHED') {
                logger.warn('Applicant attempting to view non-published job', {
                    jobId,
                    jobStatus: job.status,
                    userId,
                    userRole
                });
                return createResponse(404, {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Job not found'
                    }
                });
            }
        }

        // Transform the data to match frontend expectations
        const transformedJob = {
            ...transformJobForResponse(job),
            // Only include creator info for admins
            ...(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN ? {
                createdBy: job.createdBy,
                updatedAt: job.updatedAt,
                publishedAt: job.publishedAt,
                closedAt: job.closedAt
            } : {})
        };

        // Increment view count for successful job views (fire and forget)
        if (job.status === 'ACTIVE' || job.status === 'PUBLISHED') {
            try {
                const updateParams = {
                    TableName: tableName,
                    Key: { jobId: jobId },
                    UpdateExpression: 'SET viewCount = if_not_exists(viewCount, :zero) + :inc',
                    ExpressionAttributeValues: {
                        ':zero': 0,
                        ':inc': 1
                    }
                };
                // Don't await this - fire and forget
                dynamodb.send(new (require('@aws-sdk/lib-dynamodb').UpdateCommand)(updateParams));
            } catch (viewCountError) {
                // Log but don't fail the main request
                logger.warn('Failed to increment view count', {
                    jobId,
                    error: viewCountError instanceof Error ? viewCountError.message : 'Unknown error'
                });
            }
        }

        logger.info('Successfully retrieved job', {
            jobId,
            jobTitle: job.title,
            jobStatus: job.status,
            userId,
            userRole
        });

        return createResponse(200, {
            success: true,
            data: {
                job: transformedJob
            },
            message: 'Job retrieved successfully'
        });

    } catch (error) {
        logger.error('Failed to retrieve job', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            jobId: event.pathParameters?.id,
            userId: event.requestContext?.authorizer?.userId,
            userRole: event.requestContext?.authorizer?.role
        });

        return createResponse(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve job'
            }
        });
    }
};

export default handler;