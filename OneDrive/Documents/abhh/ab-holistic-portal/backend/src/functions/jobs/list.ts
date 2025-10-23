import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { UserRole } from '../../types';
import { transformJobForResponse } from '../../utils/validation';

const logger = new Logger('JobsList');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Jobs List Handler
 *
 * SECURITY: This endpoint requires authentication via JWT token
 * All users must be authenticated to view job listings
 * Admins can see all jobs, applicants see only active/published jobs
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
    // Extract origin header for CORS
    const requestOrigin = event.headers['origin'] || event.headers['Origin'];

    logger.info('Jobs list request received', {
        requestId: context.awsRequestId,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.headers['User-Agent'],
        origin: requestOrigin
    });

    try {
        // CRITICAL SECURITY: Verify user authentication from authorizer
        const authContext = event.requestContext?.authorizer;
        if (!authContext || !authContext.principalId) {
            logger.warn('Unauthorized job list access attempt', {
                sourceIp: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent']
            });
            return createResponse(401, {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required to access job listings'
                }
            }, {}, true, requestOrigin);
        }

        const userId = authContext.userId;
        const userRole = authContext.role as UserRole;
        const userEmail = authContext.email;

        // Check if this is a request for user's own jobs
        const myJobsRequested = event.queryStringParameters?.my === 'true';

        logger.info('Authenticated user accessing jobs', {
            userId: (context as any).requestContext?.authorizer?.principalId || "unknown",
            userRole,
            userEmail,
            myJobsRequested
        });

        // Validate user role for my jobs request
        if (myJobsRequested && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
            logger.warn('Non-admin user attempting to access my jobs', {
                userId,
                userRole,
                userEmail
            });
            return createResponse(403, {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only administrators can access their own job listings'
                }
            }, {}, true, requestOrigin);
        }

        // Get jobs from DynamoDB
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

        // Parse query parameters for filtering and search
        const queryParams = event.queryStringParameters || {};
        const {
            search,
            department,
            location,
            jobType,
            status,
            experienceLevel,
            remotePolicy,
            skills,
            salaryMin,
            salaryMax,
            createdAfter,
            createdBefore,
            limit,
            offset,
            sortBy,
            sortOrder
        } = queryParams;

        // Pagination parameters
        const pageLimit = Math.min(parseInt(limit || '50'), 100); // Max 100 items per page
        const pageOffset = parseInt(offset || '0');

        logger.info('Querying jobs table with filters', {
            tableName,
            filters: {
                search,
                department,
                location,
                jobType,
                status,
                experienceLevel,
                remotePolicy,
                skills,
                salaryRange: salaryMin || salaryMax ? { min: salaryMin, max: salaryMax } : undefined,
                dateRange: createdAfter || createdBefore ? { after: createdAfter, before: createdBefore } : undefined
            },
            pagination: { limit: pageLimit, offset: pageOffset },
            sorting: { sortBy, sortOrder }
        });

        // Build filter expression based on user role and request type
        let filterExpression = 'attribute_exists(jobId) AND attribute_exists(title)';
        let expressionAttributeValues: any = {};
        let expressionAttributeNames: any = {};
        let counter = 0;

        // Helper function to add filter conditions
        const addFilterCondition = (condition: string, value: any, attributeName?: string) => {
            if (value !== undefined && value !== null && value !== '') {
                const valueKey = `:val${counter}`;
                filterExpression += ` AND ${condition}`;
                expressionAttributeValues[valueKey] = value;

                if (attributeName) {
                    const nameKey = `#attr${counter}`;
                    expressionAttributeNames[nameKey] = attributeName;
                    filterExpression = filterExpression.replace(condition, condition.replace(`#${attributeName}`, nameKey));
                }
                counter++;
            }
        };

        if (myJobsRequested) {
            // Filter for admin's own jobs
            addFilterCondition(`createdBy = :val${counter}`, userId);
        } else {
            // Role-based access control
            if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
                // Admins can see all jobs (including drafts)
                logger.info('Admin user - showing all jobs', { userRole });
            } else {
                // Applicants can only see active/published jobs
                filterExpression += ` AND (#status = :val${counter} OR #status = :val${counter + 1})`;
                expressionAttributeValues[`:val${counter}`] = 'ACTIVE';
                expressionAttributeValues[`:val${counter + 1}`] = 'PUBLISHED';
                expressionAttributeNames[`#attr${counter}`] = 'status';
                counter += 2;
                logger.info('Applicant user - filtering to active/published jobs only');
            }
        }

        // Add search filters
        if (search) {
            // Search in title, description, and department
            filterExpression += ` AND (contains(#title, :val${counter}) OR contains(#description, :val${counter + 1}) OR contains(#department, :val${counter + 2}))`;
            expressionAttributeValues[`:val${counter}`] = search;
            expressionAttributeValues[`:val${counter + 1}`] = search;
            expressionAttributeValues[`:val${counter + 2}`] = search;
            expressionAttributeNames[`#attr${counter}`] = 'title';
            expressionAttributeNames[`#attr${counter + 1}`] = 'description';
            expressionAttributeNames[`#attr${counter + 2}`] = 'department';
            counter += 3;
        }

        // Add specific field filters
        if (department) {
            addFilterCondition(`#department = :val${counter}`, department, 'department');
        }

        if (location) {
            addFilterCondition(`contains(#location, :val${counter})`, location, 'location');
        }

        if (jobType) {
            addFilterCondition(`#jobType = :val${counter}`, jobType.toUpperCase(), 'jobType');
        }

        if (status && (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN)) {
            addFilterCondition(`#status = :val${counter}`, status.toUpperCase(), 'status');
        }

        if (experienceLevel) {
            addFilterCondition(`#experienceLevel = :val${counter}`, experienceLevel, 'experienceLevel');
        }

        if (remotePolicy) {
            addFilterCondition(`#remotePolicy = :val${counter}`, remotePolicy, 'remotePolicy');
        }

        if (skills) {
            const skillsList = skills.split(',').map((s: string) => s.trim());
            const skillConditions = skillsList.map((skill, index) => {
                const valueKey = `:val${counter + index}`;
                expressionAttributeValues[valueKey] = skill;
                return `contains(#skills, ${valueKey})`;
            });
            filterExpression += ` AND (${skillConditions.join(' OR ')})`;
            expressionAttributeNames[`#attr${counter}`] = 'skills';
            counter += skillsList.length;
        }

        // Date range filters
        if (createdAfter) {
            addFilterCondition(`#createdAt >= :val${counter}`, createdAfter, 'createdAt');
        }

        if (createdBefore) {
            addFilterCondition(`#createdAt <= :val${counter}`, createdBefore, 'createdAt');
        }

        // Salary range filters (if salary information is available)
        if (salaryMin) {
            filterExpression += ` AND (attribute_not_exists(salaryRange) OR salaryRange.#min >= :val${counter})`;
            expressionAttributeValues[`:val${counter}`] = parseInt(salaryMin);
            expressionAttributeNames[`#attr${counter}`] = 'min';
            counter++;
        }

        if (salaryMax) {
            filterExpression += ` AND (attribute_not_exists(salaryRange) OR salaryRange.#max <= :val${counter})`;
            expressionAttributeValues[`:val${counter}`] = parseInt(salaryMax);
            expressionAttributeNames[`#attr${counter}`] = 'max';
            counter++;
        }

        const params: any = {
            TableName: tableName,
            FilterExpression: filterExpression,
            Limit: pageLimit + pageOffset + 50 // Get extra items for sorting and pagination
        };

        // Add expression attribute names and values if needed
        if (Object.keys(expressionAttributeValues).length > 0) {
            params.ExpressionAttributeValues = expressionAttributeValues;
        }

        if (Object.keys(expressionAttributeNames).length > 0) {
            params.ExpressionAttributeNames = expressionAttributeNames;
        }

        logger.info('Executing DynamoDB scan with advanced filtering', {
            filterExpression,
            expressionAttributeValues,
            expressionAttributeNames,
            pagination: { limit: pageLimit, offset: pageOffset }
        });

        // Execute the scan - we may need to scan multiple times for pagination
        let allItems: any[] = [];
        let lastEvaluatedKey = undefined;
        let totalScanned = 0;
        const maxScans = 5; // Prevent infinite loops
        let scanCount = 0;

        do {
            if (lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }

            const scanResult = await dynamodb.send(new ScanCommand(params));

            if (scanResult.Items) {
                allItems = allItems.concat(scanResult.Items);
                totalScanned += scanResult.ScannedCount || 0;
            }

            lastEvaluatedKey = scanResult.LastEvaluatedKey;
            scanCount++;

        } while (lastEvaluatedKey && allItems.length < (pageOffset + pageLimit * 2) && scanCount < maxScans);

        if (allItems.length === 0) {
            logger.warn('No items returned from DynamoDB');
            return createResponse(200, {
                success: true,
                data: {
                    jobs: [],
                    count: 0,
                    totalCount: 0,
                    hasMore: false,
                    pagination: {
                        limit: pageLimit,
                        offset: pageOffset,
                        hasMore: false,
                        totalCount: 0
                    },
                    filters: queryParams,
                    userId: userId,
                    userRole: userRole,
                    myJobs: myJobsRequested
                },
                message: 'No jobs found'
            }, {}, true, requestOrigin);
        }

        // Sort the results
        const sortField = sortBy || 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        allItems.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue) * sortDirection;
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * sortDirection;
            } else {
                // Default string comparison
                return String(aValue || '').localeCompare(String(bValue || '')) * sortDirection;
            }
        });

        // Apply pagination
        const paginatedItems = allItems.slice(pageOffset, pageOffset + pageLimit);
        const hasMore = allItems.length > (pageOffset + pageLimit) || !!lastEvaluatedKey;
        const totalCount = allItems.length;

        // Transform the data to match frontend expectations with enhanced security
        const jobs = paginatedItems.map((item: any) => ({
            ...transformJobForResponse(item),
            // Only include creator info for admins
            ...(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN ? {
                createdBy: item.createdBy,
                updatedAt: item.updatedAt,
                publishedAt: item.publishedAt,
                closedAt: item.closedAt
            } : {})
        }));

        logger.info('Successfully retrieved jobs with advanced filtering', {
            totalScanned,
            totalFiltered: allItems.length,
            returnedCount: jobs.length,
            pagination: { limit: pageLimit, offset: pageOffset, hasMore },
            userId: (context as any).requestContext?.authorizer?.principalId || "unknown",
            userRole: UserRole.APPLICANT,
            myJobs: myJobsRequested,
            appliedFilters: Object.keys(queryParams).length
        });

        return createResponse(200, {
            success: true,
            data: {
                jobs: jobs,
                count: jobs.length,
                totalCount: totalCount,
                hasMore: hasMore,
                pagination: {
                    limit: pageLimit,
                    offset: pageOffset,
                    hasMore: hasMore,
                    totalCount: totalCount,
                    nextOffset: hasMore ? pageOffset + pageLimit : null
                },
                filters: {
                    applied: queryParams,
                    available: {
                        search: 'Full text search in title, description, department',
                        department: 'Filter by department name',
                        location: 'Filter by location (partial match)',
                        jobType: 'FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE',
                        status: 'DRAFT, PUBLISHED, CLOSED, ARCHIVED (admin only)',
                        experienceLevel: 'entry, mid, senior, lead, principal',
                        remotePolicy: 'remote, hybrid, on_site',
                        skills: 'Comma-separated list of skills',
                        salaryMin: 'Minimum salary amount',
                        salaryMax: 'Maximum salary amount',
                        createdAfter: 'ISO date string',
                        createdBefore: 'ISO date string',
                        limit: 'Items per page (max 100)',
                        offset: 'Starting position',
                        sortBy: 'Field to sort by (createdAt, title, department, etc.)',
                        sortOrder: 'asc or desc'
                    }
                },
                sorting: {
                    sortBy: sortField,
                    sortOrder: sortOrder || 'desc'
                },
                userId: userId,
                userRole: userRole,
                myJobs: myJobsRequested
            },
            message: `Jobs retrieved successfully. Found ${jobs.length} jobs.`
        }, {}, true, requestOrigin);

    } catch (error) {
        logger.error('Failed to retrieve jobs', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            userId: "unknown",
            userRole: "unknown"
        });

        return createResponse(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve jobs'
            }
        }, {}, true, requestOrigin);
    }
};

export default handler;