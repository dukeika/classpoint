import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import { UserRole, Application, ApplicationStage, ApplicationStatus } from '../../types';

const logger = new Logger('ApplicationsList');
const dbService = DatabaseService.getInstance();

/**
 * List Applications Handler
 *
 * SECURITY: Requires authentication via JWT token
 * - Admins can view all applications or filter by job
 * - Applicants can only view their own applications
 *
 * Query Parameters:
 * - jobId: Filter applications by job (admin only)
 * - stage: Filter by application stage
 * - status: Filter by application status
 * - limit: Page size (default 50, max 100)
 * - offset: Pagination offset
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Extract origin header for CORS
  const requestOrigin = event.headers['origin'] || event.headers['Origin'];

  logger.info('Applications list request received', {
    requestId: context.awsRequestId,
    sourceIp: event.requestContext.identity.sourceIp,
    userAgent: event.headers['User-Agent'],
    origin: requestOrigin
  });

  try {
    // SECURITY: Verify authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized application list access attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access applications'
        }
      }, {}, true, requestOrigin);
    }

    const userId = authContext.userId || authContext.principalId;
    const userRole = authContext.role as UserRole;

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const {
      jobId,
      stage,
      status,
      limit,
      offset
    } = queryParams;

    const pageLimit = Math.min(parseInt(limit || '50'), 100);
    const pageOffset = parseInt(offset || '0');

    logger.info('Fetching applications with filters', {
      userId,
      userRole,
      jobId,
      stage,
      status,
      pagination: { limit: pageLimit, offset: pageOffset }
    });

    let applications: Application[] = [];
    let totalCount = 0;

    // Role-based access control
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      // Admins can view all applications
      if (jobId) {
        // Query by job
        const result = await dbService.query<Application>(
          process.env.APPLICATIONS_TABLE!,
          'GSI1PK = :jobId',
          {
            indexName: 'JobIndex',
            expressionAttributeValues: {
              ':jobId': `JOB#${jobId}`
            },
            limit: pageLimit + pageOffset + 50
          }
        );
        applications = result.items;
        totalCount = result.count;
      } else {
        // Scan all applications (careful with large datasets)
        const result = await dbService.scan<Application>(
          process.env.APPLICATIONS_TABLE!,
          {
            limit: pageLimit + pageOffset + 50
          }
        );
        applications = result.items;
        totalCount = result.count;
      }
    } else {
      // Applicants can only view their own applications
      const result = await dbService.query<Application>(
        process.env.APPLICATIONS_TABLE!,
        'GSI2PK = :applicantId',
        {
          indexName: 'ApplicantIndex',
          expressionAttributeValues: {
            ':applicantId': `APPLICANT#${userId}`
          },
          limit: pageLimit + pageOffset + 50
        }
      );
      applications = result.items;
      totalCount = result.count;
    }

    // Apply additional filters
    if (stage || status) {
      applications = applications.filter(app => {
        if (stage && app.stage !== stage) return false;
        if (status && app.status !== status) return false;
        return true;
      });
      totalCount = applications.length;
    }

    // Sort by application date (most recent first)
    applications.sort((a, b) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    // Apply pagination
    const paginatedApplications = applications.slice(pageOffset, pageOffset + pageLimit);
    const hasMore = applications.length > (pageOffset + pageLimit);

    // Enrich applications with job details for better UX
    const enrichedApplications = await enrichApplicationsWithJobDetails(paginatedApplications);

    logger.info('Applications retrieved successfully', {
      count: paginatedApplications.length,
      totalCount,
      hasMore,
      userId,
      userRole
    });

    return createResponse(200, {
      success: true,
      data: {
        applications: enrichedApplications,
        count: paginatedApplications.length,
        totalCount,
        hasMore,
        pagination: {
          limit: pageLimit,
          offset: pageOffset,
          hasMore,
          totalCount,
          nextOffset: hasMore ? pageOffset + pageLimit : null
        },
        filters: {
          applied: queryParams,
          available: {
            jobId: 'Filter by job ID',
            stage: Object.values(ApplicationStage).join(', '),
            status: Object.values(ApplicationStatus).join(', '),
            limit: 'Items per page (max 100)',
            offset: 'Starting position'
          }
        }
      },
      message: `Found ${paginatedApplications.length} applications`
    }, {}, true, requestOrigin);

  } catch (error) {
    logger.error('Failed to retrieve applications', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve applications'
      }
    }, {}, true, requestOrigin);
  }
};

/**
 * Enrich applications with job details
 */
async function enrichApplicationsWithJobDetails(
  applications: Application[]
): Promise<Array<Application & { jobTitle?: string; jobDepartment?: string }>> {
  try {
    const jobIds = [...new Set(applications.map(app => app.jobId))];

    // Batch get job details
    const jobDetails = await Promise.all(
      jobIds.map(async (jobId) => {
        const job = await dbService.getItem(
          process.env.JOBS_TABLE!,
          { jobId }
        );
        return job ? { jobId, title: (job as any).title, department: (job as any).department } : null;
      })
    );

    const jobMap = new Map(
      jobDetails.filter(Boolean).map(job => [job!.jobId, job])
    );

    return applications.map(app => ({
      ...app,
      jobTitle: jobMap.get(app.jobId)?.title,
      jobDepartment: jobMap.get(app.jobId)?.department
    }));
  } catch (error) {
    logger.warn('Failed to enrich applications with job details', { error });
    return applications;
  }
}

export default handler;
