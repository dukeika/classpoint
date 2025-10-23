import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { UserRole } from '../../types';
import { validateJobId } from '../../utils/validation';

const logger = new Logger('JobDelete');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Delete Job Handler
 *
 * SECURITY: This endpoint requires authentication via JWT token
 * - Only admins can delete jobs
 * - Only the creator or super admin can delete a job
 * - Jobs with active applications should be archived instead of deleted
 * - Proper validation and safety checks
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
    logger.info('Job deletion request received', {
        requestId: context.awsRequestId,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.headers['User-Agent']
    });

    try {
        // CRITICAL SECURITY: Verify user authentication from authorizer
        const authContext = event.requestContext?.authorizer;
        if (!authContext || !authContext.principalId) {
            logger.warn('Unauthorized job deletion attempt', {
                sourceIp: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent']
            });
            return createResponse(401, {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required to delete jobs'
                }
            });
        }

        const userId = authContext.userId;
        const userRole = authContext.role as UserRole;
        const userEmail = authContext.email;

        // SECURITY: Only admins can delete jobs
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
            logger.warn('Non-admin user attempting to delete job', {
                userId,
                userRole,
                userEmail
            });
            return createResponse(403, {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only administrators can delete jobs'
                }
            });
        }

        // Validate job ID parameter
        const jobId = event.pathParameters?.id;
        if (!jobId || !validateJobId(jobId)) {
            logger.warn('Invalid job ID provided for deletion', {
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

        logger.info('Authenticated admin attempting to delete job', {
            userId,
            userRole,
            userEmail,
            jobId
        });

        const tableName = process.env.JOBS_TABLE;
        const applicationsTableName = process.env.APPLICATIONS_TABLE;

        if (!tableName || !applicationsTableName) {
            logger.error('Required environment variables not configured', {
                jobsTable: tableName,
                applicationsTable: applicationsTableName
            });
            return createResponse(500, {
                success: false,
                error: {
                    code: 'CONFIGURATION_ERROR',
                    message: 'Database configuration error'
                }
            });
        }

        // First, get the existing job to verify ownership and existence
        const getParams = {
            TableName: tableName,
            Key: {
                jobId: jobId
            }
        };

        const existingJobResult = await dynamodb.send(new GetCommand(getParams));

        if (!existingJobResult.Item) {
            logger.warn('Job not found for deletion', { jobId, userId, userRole });
            return createResponse(404, {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }

        const existingJob = existingJobResult.Item;

        // SECURITY: Only the creator or super admin can delete a job
        if (userRole !== UserRole.SUPER_ADMIN && existingJob.createdBy !== userId) {
            logger.warn('Admin attempting to delete job they did not create', {
                jobId,
                userId,
                userRole,
                jobCreator: existingJob.createdBy
            });
            return createResponse(403, {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only delete jobs that you created'
                }
            });
        }

        // Check for active applications - we should archive instead of delete
        const applicationsQueryParams = {
            TableName: applicationsTableName,
            IndexName: 'JobIndex',
            KeyConditionExpression: 'jobId = :jobId',
            ExpressionAttributeValues: {
                ':jobId': jobId
            },
            Select: 'COUNT' as const
        };

        let applicationCount = 0;
        try {
            const applicationsResult = await dynamodb.send(new QueryCommand(applicationsQueryParams));
            applicationCount = applicationsResult.Count || 0;
        } catch (error) {
            logger.warn('Failed to check for applications, proceeding with deletion', {
                jobId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Get query parameter for force delete
        const forceDelete = event.queryStringParameters?.force === 'true';

        if (applicationCount > 0 && !forceDelete) {
            logger.warn('Attempting to delete job with active applications', {
                jobId,
                applicationCount,
                userId,
                userRole
            });
            return createResponse(409, {
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: `Cannot delete job with ${applicationCount} application(s). Consider archiving instead or use force=true query parameter.`,
                    details: {
                        applicationCount,
                        suggestedAction: 'archive'
                    }
                }
            });
        }

        // Log the deletion action
        logger.info('Proceeding with job deletion', {
            jobId,
            jobTitle: existingJob.title,
            applicationCount,
            forceDelete,
            userId,
            userRole
        });

        // Execute the deletion
        const deleteParams = {
            TableName: tableName,
            Key: {
                jobId: jobId
            },
            ConditionExpression: 'attribute_exists(jobId)'
        };

        await dynamodb.send(new DeleteCommand(deleteParams));

        logger.info('Successfully deleted job', {
            jobId,
            jobTitle: existingJob.title,
            userId,
            userRole,
            applicationCount,
            forceDelete
        });

        return createResponse(200, {
            success: true,
            data: {
                deletedJobId: jobId,
                deletedJobTitle: existingJob.title,
                applicationCount
            },
            message: 'Job deleted successfully'
        });

    } catch (error) {
        // Handle conditional check failed error specifically
        if (error && typeof error === 'object' && 'name' in error && error.name === 'ConditionalCheckFailedException') {
            logger.warn('Job deletion failed - job may have been deleted already', {
                jobId: event.pathParameters?.id,
                userId: event.requestContext?.authorizer?.userId
            });
            return createResponse(404, {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Job not found or already deleted'
                }
            });
        }

        logger.error('Failed to delete job', {
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
                message: 'Failed to delete job'
            }
        });
    }
};

export default handler; 
