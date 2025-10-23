import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import { validateRequest } from '../../utils/validation';
import {
  UserRole,
  Application,
  ApplicationStage,
  UpdateApplicationStageRequest,
  StageHistoryEntry
} from '../../types';

const logger = new Logger('ApplicationsUpdateStage');
const dbService = DatabaseService.getInstance();

// Define valid stage transitions
const VALID_STAGE_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  [ApplicationStage.APPLIED]: [
    ApplicationStage.SCREENING,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.SCREENING]: [
    ApplicationStage.WRITTEN_TEST,
    ApplicationStage.VIDEO_TEST,
    ApplicationStage.FIRST_INTERVIEW,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.WRITTEN_TEST]: [
    ApplicationStage.VIDEO_TEST,
    ApplicationStage.FIRST_INTERVIEW,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.VIDEO_TEST]: [
    ApplicationStage.FIRST_INTERVIEW,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.FIRST_INTERVIEW]: [
    ApplicationStage.SECOND_INTERVIEW,
    ApplicationStage.FINAL_INTERVIEW,
    ApplicationStage.REFERENCE_CHECK,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.SECOND_INTERVIEW]: [
    ApplicationStage.FINAL_INTERVIEW,
    ApplicationStage.REFERENCE_CHECK,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.FINAL_INTERVIEW]: [
    ApplicationStage.REFERENCE_CHECK,
    ApplicationStage.OFFER_EXTENDED,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.REFERENCE_CHECK]: [
    ApplicationStage.OFFER_EXTENDED,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.OFFER_EXTENDED]: [
    ApplicationStage.HIRED,
    ApplicationStage.REJECTED
  ],
  [ApplicationStage.HIRED]: [],
  [ApplicationStage.REJECTED]: [],
  [ApplicationStage.WITHDRAWN]: []
};

/**
 * Update Application Stage Handler
 *
 * SECURITY: Requires admin authentication
 * Only admins can update application stages
 *
 * Features:
 * - Stage transition validation
 * - Audit trail via stage history
 * - Automatic notification triggers
 * - Role and assignment updates
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Update application stage request received', {
    requestId: context.awsRequestId,
    applicationId: event.pathParameters?.id
  });

  try {
    // SECURITY: Verify admin authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized update stage access attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to update application stage'
        }
      });
    }

    const userId = authContext.userId || authContext.principalId;
    const userRole = authContext.role as UserRole;

    // SECURITY: Only admins can update stages
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      logger.warn('Non-admin attempting to update application stage', {
        userId,
        userRole
      });
      return createResponse(403, {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can update application stages'
        }
      });
    }

    // Extract application ID from path
    const applicationId = event.pathParameters?.id;
    if (!applicationId) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Application ID is required'
        }
      });
    }

    // Validate request body
    const validationResult = validateRequest<UpdateApplicationStageRequest>(event.body, {
      stage: {
        required: true,
        type: 'string',
        enum: Object.values(ApplicationStage)
      },
      comments: { required: false, type: 'string', maxLength: 1000 },
      assignedRecruiterId: { required: false, type: 'string' },
      assignedInterviewerIds: { required: false, type: 'array' },
      nextActionDate: { required: false, type: 'string' },
      rejectionReason: { required: false, type: 'string', maxLength: 500 }
    });

    if (!validationResult.isValid) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.errors
        }
      });
    }

    const updateData = validationResult.data!;

    logger.info('Updating application stage', {
      applicationId,
      newStage: updateData.stage,
      userId
    });

    // Get current application
    const application = await dbService.getItem<Application>(
      process.env.APPLICATIONS_TABLE!,
      { applicationId }
    );

    if (!application) {
      logger.warn('Application not found', { applicationId });
      return createResponse(404, {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    // Validate stage transition
    const currentStage = application.stage;
    const newStage = updateData.stage as ApplicationStage;

    if (currentStage === newStage) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Application is already in this stage'
        }
      });
    }

    const validTransitions = VALID_STAGE_TRANSITIONS[currentStage] || [];
    if (!validTransitions.includes(newStage)) {
      logger.warn('Invalid stage transition', {
        applicationId,
        currentStage,
        newStage,
        validTransitions
      });
      return createResponse(400, {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${currentStage} to ${newStage}`,
          details: {
            currentStage,
            requestedStage: newStage,
            validTransitions
          }
        }
      });
    }

    // Build stage history entry
    const now = dbService.getTimestamp();
    const stageHistoryEntry: StageHistoryEntry = {
      stage: newStage,
      changedBy: userId,
      changedAt: now,
      comments: updateData.comments,
      automaticTransition: false
    };

    // Update application
    const updateExpression = [
      'stage = :stage',
      'stageHistory = list_append(stageHistory, :newHistory)'
    ];

    const expressionAttributeValues: Record<string, any> = {
      ':stage': newStage,
      ':newHistory': [stageHistoryEntry]
    };

    // Optional fields
    if (updateData.assignedRecruiterId) {
      updateExpression.push('assignedRecruiterId = :recruiterId');
      expressionAttributeValues[':recruiterId'] = updateData.assignedRecruiterId;
    }

    if (updateData.assignedInterviewerIds) {
      updateExpression.push('assignedInterviewerIds = :interviewerIds');
      expressionAttributeValues[':interviewerIds'] = updateData.assignedInterviewerIds;
    }

    if (updateData.nextActionDate) {
      updateExpression.push('nextActionDate = :nextActionDate');
      expressionAttributeValues[':nextActionDate'] = updateData.nextActionDate;
    }

    // Update GSI keys for stage-based queries
    updateExpression.push('GSI1SK = :gsi1sk');
    expressionAttributeValues[':gsi1sk'] = `STAGE#${newStage}#${now}`;

    // Update application in database
    const updatedApplication = await dbService.updateItem<Application>(
      process.env.APPLICATIONS_TABLE!,
      { applicationId },
      {
        updateExpression: `SET ${updateExpression.join(', ')}`,
        expressionAttributeValues
      }
    );

    logger.info('Application stage updated successfully', {
      applicationId,
      previousStage: currentStage,
      newStage,
      userId
    });

    // TODO: Trigger notification to applicant about stage change
    // This would be handled by a separate notification service or event

    return createResponse(200, {
      success: true,
      data: {
        application: {
          applicationId: updatedApplication.applicationId,
          jobId: updatedApplication.jobId,
          applicantId: updatedApplication.applicantId,
          stage: updatedApplication.stage,
          status: updatedApplication.status,
          updatedAt: updatedApplication.updatedAt,
          stageHistory: updatedApplication.stageHistory,
          assignedRecruiterId: updatedApplication.assignedRecruiterId,
          assignedInterviewerIds: updatedApplication.assignedInterviewerIds,
          nextActionDate: updatedApplication.nextActionDate
        },
        transition: {
          from: currentStage,
          to: newStage,
          changedBy: userId,
          changedAt: now
        }
      },
      message: `Application stage updated from ${currentStage} to ${newStage}`
    });

  } catch (error) {
    logger.error('Failed to update application stage', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId: event.pathParameters?.id
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update application stage'
      }
    });
  }
};

export default handler;
