import { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, notFoundResponse } from '../../utils/response';
import { validateSchema, applicationSchemas } from '../../utils/validation';
import { DatabaseService } from '../../services/database';
import { ApplicationStage, ApplicationStatus, JobStatus } from '../../types';
import { Logger } from '../../utils/logger';

const logger = new Logger('CreateApplicationFunction');
const dbService = DatabaseService.getInstance();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    logger.info('Processing application creation request');

    // Extract user context from authorizer
    const userContext = event.requestContext.authorizer;
    if (!userContext || !userContext.userId) {
      return forbiddenResponse('Authorization required to create applications');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = validateSchema(applicationSchemas.create, body);
    const { jobId, coverLetter, resumeUrl } = validatedData;

    // Verify job exists and is open for applications
    const job = await verifyJobExists(jobId);
    if (!job) {
      return notFoundResponse('Job');
    }

    if ((job as any).status !== JobStatus.PUBLISHED) {
      return errorResponse(
        {
          code: 'JOB_NOT_AVAILABLE',
          message: 'This job is not currently accepting applications',
        },
        400
      );
    }

    // Check if user has already applied to this job
    const existingApplication = await checkExistingApplication(jobId, userContext.userId);
    if (existingApplication) {
      return errorResponse(
        {
          code: 'APPLICATION_ALREADY_EXISTS',
          message: 'You have already applied to this job',
        },
        409
      );
    }

    // Create application record
    const applicationId = dbService.generateId();
    const now = dbService.getTimestamp();

    const applicationData = {
      // DynamoDB keys
      applicationId,

      // GSI keys for efficient querying
      GSI1PK: `JOB#${jobId}`,
      GSI1SK: `STAGE#${ApplicationStage.APPLIED}#${now}`,
      GSI2PK: `APPLICANT#${userContext.userId}`,
      GSI2SK: now,

      // Application data
      jobId,
      applicantId: userContext.userId,
      stage: ApplicationStage.APPLIED,
      status: ApplicationStatus.ACTIVE,
      coverLetter,
      resumeUrl,
      customAnswers: validatedData.customAnswers || {},

      // Timestamps
      appliedAt: now,
      createdAt: now,
      updatedAt: now,

      // Stage history
      stageHistory: [
        {
          stage: ApplicationStage.APPLIED,
          changedBy: userContext.userId,
          changedAt: now,
          comments: 'Application submitted',
          automaticTransition: false
        }
      ],

      // Metadata
      priority: 'medium',
      tags: [],
      notes: [],
      scores: [],

      // Entity type for DynamoDB
      EntityType: 'Application'
    };

    // Save application to database
    const createdApplication = await dbService.putItem(
      process.env.APPLICATIONS_TABLE!,
      applicationData,
      'attribute_not_exists(applicationId)'
    );

    // Update job application count
    await updateJobApplicationCount(jobId);

    logger.info('Application created successfully', {
      applicationId,
      jobId,
      applicantId: userContext.userId
    });

    // Return sanitized application data
    const responseApplication = {
      applicationId: createdApplication.applicationId,
      jobId: createdApplication.jobId,
      applicantId: createdApplication.applicantId,
      stage: createdApplication.stage,
      status: createdApplication.status,
      coverLetter: createdApplication.coverLetter,
      resumeUrl: createdApplication.resumeUrl,
      customAnswers: createdApplication.customAnswers,
      appliedAt: createdApplication.appliedAt,
      updatedAt: createdApplication.updatedAt,
      stageHistory: createdApplication.stageHistory,
      priority: createdApplication.priority,
      tags: createdApplication.tags
    };

    return successResponse(responseApplication, 'Application submitted successfully');

  } catch (error) {
    logger.error('Application creation error:', error as Record<string, unknown>);

    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        const errorDetails = error instanceof Error && (error as any).details ? (error as any).details as Record<string, unknown> : undefined;
        return validationErrorResponse(error.message, errorDetails);
      }

      if (error.name === 'ConditionalCheckFailedException') {
        return errorResponse(
          {
            code: 'APPLICATION_ALREADY_EXISTS',
            message: 'An application with this ID already exists',
          },
          409
        );
      }
    }

    return errorResponse(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while creating the application',
      },
      500
    );
  }
};

/**
 * Verify that the job exists and get job details
 */
async function verifyJobExists(jobId: string) {
  try {
    const job = await dbService.getItem(
      process.env.JOBS_TABLE!,
      { jobId }
    );
    return job;
  } catch (error) {
    logger.error('Error verifying job exists', { error, jobId });
    return null;
  }
}

/**
 * Check if user has already applied to this job
 */
async function checkExistingApplication(jobId: string, applicantId: string): Promise<boolean> {
  try {
    const result = await dbService.query(
      process.env.APPLICATIONS_TABLE!,
      'GSI2PK = :applicantId',
      {
        indexName: 'ApplicantIndex',
        filterExpression: 'jobId = :jobId',
        expressionAttributeValues: {
          ':applicantId': `APPLICANT#${applicantId}`,
          ':jobId': jobId
        },
        limit: 1
      }
    );

    return result.count > 0;
  } catch (error) {
    logger.warn('Error checking existing application, proceeding', { error });
    return false;
  }
}

/**
 * Update job application count
 */
async function updateJobApplicationCount(jobId: string): Promise<void> {
  try {
    await dbService.updateItem(
      process.env.JOBS_TABLE!,
      { jobId },
      {
        updateExpression: 'ADD applicationCount :increment',
        expressionAttributeValues: {
          ':increment': 1
        }
      }
    );

    logger.info('Job application count updated', { jobId });
  } catch (error) {
    logger.warn('Failed to update job application count', { error, jobId });
    // Don't throw error as application was created successfully
  }
}
