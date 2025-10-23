import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { UserRole, JobStatus, JobType, RemotePolicy, UpdateJobRequest } from '../../types';
import { validateJobId, validateUpdateJobRequest, validateJobStatusTransition, transformJobForResponse } from '../../utils/validation';

const logger = new Logger('JobUpdate');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Update Job Handler
 *
 * SECURITY: This endpoint requires authentication via JWT token
 * - Only admins can update jobs
 * - Only the creator or super admin can modify a job
 * - All fields are optional, only provided fields are updated
 * - Proper validation on all input fields
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
    logger.info('Job update request received', {
        requestId: context.awsRequestId,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.headers['User-Agent']
    });

    try {
        // CRITICAL SECURITY: Verify user authentication from authorizer
        const authContext = event.requestContext?.authorizer;
        if (!authContext || !authContext.principalId) {
            logger.warn('Unauthorized job update attempt', {
                sourceIp: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent']
            });
            return createResponse(401, {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required to update jobs'
                }
            });
        }

        const userId = authContext.userId;
        const userRole = authContext.role as UserRole;
        const userEmail = authContext.email;

        // SECURITY: Only admins can update jobs
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
            logger.warn('Non-admin user attempting to update job', {
                userId,
                userRole,
                userEmail
            });
            return createResponse(403, {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only administrators can update jobs'
                }
            });
        }

        // Validate job ID parameter
        const jobId = event.pathParameters?.id;
        if (!jobId || !validateJobId(jobId)) {
            logger.warn('Invalid job ID provided for update', {
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

        // Parse and validate request body
        let requestBody: UpdateJobRequest;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            logger.warn('Invalid JSON in request body', {
                jobId,
                userId,
                parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
            });
            return createResponse(400, {
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Invalid JSON in request body'
                }
            });
        }

        // Validate update request
        const validationResult = validateUpdateJobRequest(requestBody);
        if (!validationResult.isValid) {
            logger.warn('Invalid update job request', {
                jobId,
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
            });
        }

        const validatedData = validationResult.data;

        logger.info('Authenticated admin updating job', {
            userId,
            userRole,
            userEmail,
            jobId,
            updateFields: Object.keys(requestBody)
        });

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

        // First, get the existing job to verify ownership and existence
        const getParams = {
            TableName: tableName,
            Key: {
                jobId: jobId
            }
        };

        const existingJobResult = await dynamodb.send(new GetCommand(getParams));

        if (!existingJobResult.Item) {
            logger.warn('Job not found for update', { jobId, userId, userRole });
            return createResponse(404, {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }

        const existingJob = existingJobResult.Item;

        // SECURITY: Only the creator or super admin can modify a job
        if (userRole !== UserRole.SUPER_ADMIN && existingJob.createdBy !== userId) {
            logger.warn('Admin attempting to update job they did not create', {
                jobId,
                userId,
                userRole,
                jobCreator: existingJob.createdBy
            });
            return createResponse(403, {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only update jobs that you created'
                }
            });
        }

        // Build update expression dynamically
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};
        let counter = 0;

        // Helper function to add update field
        const addUpdateField = (field: string, value: any, dbField?: string) => {
            if (value !== undefined && value !== null) {
                const key = `:val${counter}`;
                const nameKey = `#field${counter}`;
                updateExpressions.push(`${nameKey} = ${key}`);
                expressionAttributeNames[nameKey] = dbField || field;
                expressionAttributeValues[key] = value;
                counter++;
            }
        };

        // Add updateable fields using validated data
        addUpdateField('title', validatedData.title);
        addUpdateField('description', validatedData.description);
        addUpdateField('requirements', validatedData.requirements);
        addUpdateField('responsibilities', validatedData.responsibilities);
        addUpdateField('qualifications', validatedData.qualifications);
        addUpdateField('department', validatedData.department);
        addUpdateField('location', validatedData.location);
        addUpdateField('remotePolicy', validatedData.remotePolicy);
        addUpdateField('jobType', validatedData.jobType);
        addUpdateField('status', validatedData.status);
        addUpdateField('salaryRange', validatedData.salaryRange);
        addUpdateField('benefits', validatedData.benefits);
        addUpdateField('skills', validatedData.skills);
        addUpdateField('experienceLevel', validatedData.experienceLevel);
        addUpdateField('applicationDeadline', validatedData.applicationDeadline);
        addUpdateField('startDate', validatedData.startDate);
        addUpdateField('tags', validatedData.tags);

        // Always update the updatedAt timestamp
        const updatedAt = new Date().toISOString();
        addUpdateField('updatedAt', updatedAt);

        // Validate status transition if status is being updated
        if (validatedData.status) {
            const { isValid: isValidTransition, error: transitionError } = validateJobStatusTransition(
                existingJob.status,
                validatedData.status
            );

            if (!isValidTransition) {
                logger.warn('Invalid job status transition', {
                    jobId,
                    currentStatus: existingJob.status,
                    newStatus: validatedData.status,
                    error: transitionError,
                    userId
                });
                return createResponse(400, {
                    success: false,
                    error: {
                        code: 'INVALID_STATUS_TRANSITION',
                        message: transitionError || 'Invalid status transition',
                        details: {
                            currentStatus: existingJob.status,
                            requestedStatus: validatedData.status
                        }
                    }
                });
            }
        }

        // Handle status change timestamps
        if (validatedData.status) {
            const normalizedNewStatus = validatedData.status.toLowerCase();
            const normalizedCurrentStatus = (existingJob.status || '').toLowerCase();

            if (normalizedNewStatus === 'published' && normalizedCurrentStatus !== 'published') {
                addUpdateField('publishedAt', updatedAt);
            } else if (normalizedNewStatus === 'closed' && normalizedCurrentStatus !== 'closed') {
                addUpdateField('closedAt', updatedAt);
            }
        }

        // If no fields to update
        if (updateExpressions.length === 1) { // Only updatedAt
            logger.warn('No valid fields to update provided', {
                jobId,
                userId,
                requestBody
            });
            return createResponse(400, {
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'No valid fields to update provided'
                }
            });
        }

        // Execute the update
        const updateParams = {
            TableName: tableName,
            Key: {
                jobId: jobId
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW' as const
        };

        logger.info('Executing job update', {
            jobId,
            userId,
            updateExpression: updateParams.UpdateExpression,
            fieldsUpdated: Object.keys(expressionAttributeNames).length
        });

        const updateResult = await dynamodb.send(new UpdateCommand(updateParams));

        if (!updateResult.Attributes) {
            logger.error('Update succeeded but no attributes returned', { jobId, userId });
            throw new Error('Update succeeded but no data returned');
        }

        const updatedJob = updateResult.Attributes;

        // Transform the updated job data for response
        const transformedJob = transformJobForResponse(updatedJob);

        logger.info('Successfully updated job', {
            jobId,
            jobTitle: updatedJob.title,
            jobStatus: updatedJob.status,
            userId,
            userRole
        });

        return createResponse(200, {
            success: true,
            data: {
                job: transformedJob
            },
            message: 'Job updated successfully'
        });

    } catch (error) {
        logger.error('Failed to update job', {
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
                message: 'Failed to update job'
            }
        });
    }
};

export default handler;