import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import { UserRole, Application } from '../../types';

const logger = new Logger('ApplicationsGet');
const dbService = DatabaseService.getInstance();

/**
 * Get Application Handler
 *
 * SECURITY: Requires authentication via JWT token
 * - Admins can view any application with full details
 * - Applicants can only view their own applications
 *
 * Returns comprehensive application details including:
 * - Application data
 * - Job information
 * - Stage history
 * - Notes and scores (admin only)
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Get application request received', {
    requestId: context.awsRequestId,
    applicationId: event.pathParameters?.id
  });

  try {
    // SECURITY: Verify authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized get application access attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access applications'
        }
      });
    }

    const userId = authContext.userId || authContext.principalId;
    const userRole = authContext.role as UserRole;

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

    logger.info('Fetching application', {
      applicationId,
      userId,
      userRole
    });

    // Get application from database
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

    // SECURITY: Verify access permissions
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isOwner = application.applicantId === userId;

    if (!isAdmin && !isOwner) {
      logger.warn('Unauthorized access to application', {
        applicationId,
        userId,
        userRole,
        ownerId: application.applicantId
      });
      return createResponse(403, {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this application'
        }
      });
    }

    // Enrich application with job details
    const job = await dbService.getItem(
      process.env.JOBS_TABLE!,
      { jobId: application.jobId }
    );

    // Get applicant details
    const applicant = await dbService.getItem(
      process.env.APPLICANTS_TABLE!,
      { applicantId: application.applicantId }
    );

    // Build response with role-based data filtering
    const responseData: any = {
      applicationId: application.applicationId,
      jobId: application.jobId,
      applicantId: application.applicantId,
      stage: application.stage,
      status: application.status,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      customAnswers: application.customAnswers,
      appliedAt: application.appliedAt,
      updatedAt: application.updatedAt,
      stageHistory: application.stageHistory,
      priority: application.priority,
      tags: application.tags || [],

      // Job details
      job: job ? {
        jobId: (job as any).jobId,
        title: (job as any).title,
        department: (job as any).department,
        location: (job as any).location,
        jobType: (job as any).jobType,
        status: (job as any).status
      } : null,

      // Basic applicant info
      applicant: applicant ? {
        email: (applicant as any).email,
        firstName: (applicant as any).firstName,
        lastName: (applicant as any).lastName
      } : null
    };

    // Admin-only fields
    if (isAdmin) {
      responseData.notes = application.notes || [];
      responseData.scores = application.scores || [];
      responseData.assignedRecruiterId = application.assignedRecruiterId;
      responseData.assignedInterviewerIds = application.assignedInterviewerIds || [];
      responseData.nextActionDate = application.nextActionDate;
    }

    logger.info('Application retrieved successfully', {
      applicationId,
      userId,
      userRole,
      stage: application.stage
    });

    return createResponse(200, {
      success: true,
      data: {
        application: responseData
      },
      message: 'Application retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to retrieve application', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId: event.pathParameters?.id
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve application'
      }
    });
  }
};

export default handler;
