import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import { UserRole, CreateTestRequest, Test, TestType, TestQuestion } from '../../types';
import { validateRequest } from '../../utils/validation';

const logger = new Logger('TestsCreate');
const dbService = DatabaseService.getInstance();

/**
 * Create Test Handler
 *
 * SECURITY: Requires admin authentication
 * Only admins can create tests for jobs
 *
 * Features:
 * - Create written, video, coding, or presentation tests
 * - Configure questions with different types
 * - Set time limits and passing scores
 * - Configure test settings (shuffle, full screen, etc.)
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Create test request received', {
    requestId: context.awsRequestId
  });

  try {
    // SECURITY: Verify admin authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized test creation attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to create tests'
        }
      });
    }

    const userId = authContext.userId || authContext.principalId;
    const userRole = authContext.role as UserRole;

    // SECURITY: Only admins can create tests
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      logger.warn('Non-admin attempting to create test', {
        userId,
        userRole
      });
      return createResponse(403, {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can create tests'
        }
      });
    }

    // Validate request body
    const validationResult = validateRequest<CreateTestRequest>(event.body, {
      jobId: { required: true, type: 'string' },
      title: { required: true, type: 'string', minLength: 3, maxLength: 200 },
      description: { required: true, type: 'string', maxLength: 2000 },
      instructions: { required: true, type: 'string', maxLength: 5000 },
      type: { required: true, type: 'string', enum: Object.values(TestType) },
      timeLimit: { required: true, type: 'number', min: 5, max: 300 },
      passingScore: { required: false, type: 'number', min: 0, max: 100 },
      questions: { required: true, type: 'array', minLength: 1 },
      settings: { required: true, type: 'object' },
      allowRetakes: { required: false, type: 'boolean' },
      maxAttempts: { required: false, type: 'number', min: 1, max: 10 }
    });

    if (!validationResult.isValid) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid test data',
          details: validationResult.errors
        }
      });
    }

    const testData = validationResult.data!;

    logger.info('Creating test', {
      jobId: testData.jobId,
      title: testData.title,
      type: testData.type,
      questionCount: testData.questions.length,
      userId
    });

    // Verify job exists
    const job = await dbService.getItem(
      process.env.JOBS_TABLE!,
      { jobId: testData.jobId }
    );

    if (!job) {
      logger.warn('Job not found for test creation', { jobId: testData.jobId });
      return createResponse(404, {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found'
        }
      });
    }

    // Generate IDs for test and questions
    const testId = uuidv4();
    const now = dbService.getTimestamp();

    // Add question IDs and calculate total score
    const questions: TestQuestion[] = testData.questions.map((q, index) => ({
      ...q,
      questionId: uuidv4(),
      orderIndex: index
    }));

    const totalPoints = questions.reduce((sum, q) => sum + Number(q.points), 0);

    // Create test object
    const test: Test = {
      testId,
      jobId: testData.jobId,
      title: testData.title,
      description: testData.description,
      instructions: testData.instructions,
      type: testData.type,
      timeLimit: testData.timeLimit,
      passingScore: testData.passingScore || 70,
      questions,
      isActive: true,
      allowRetakes: testData.allowRetakes || false,
      maxAttempts: testData.maxAttempts || 1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      settings: {
        shuffleQuestions: testData.settings.shuffleQuestions || false,
        shuffleOptions: testData.settings.shuffleOptions || false,
        showResultsImmediately: testData.settings.showResultsImmediately || false,
        allowReviewAnswers: testData.settings.allowReviewAnswers || true,
        preventCheating: testData.settings.preventCheating || true,
        requireWebcam: testData.settings.requireWebcam || false,
        fullScreenMode: testData.settings.fullScreenMode || true,
        disableCopyPaste: testData.settings.disableCopyPaste || true
      }
    };

    // Add DynamoDB metadata
    const testRecord = {
      ...test,
      EntityType: 'Test',
      GSI1PK: `JOB#${testData.jobId}`,
      GSI1SK: `TEST#${testId}#${now}`
    };

    // Save test to database
    await dbService.putItem(
      process.env.TESTS_TABLE!,
      testRecord
    );

    logger.info('Test created successfully', {
      testId,
      jobId: testData.jobId,
      questionCount: questions.length,
      totalPoints,
      userId
    });

    // Return test details (without correct answers for security)
    const responseTest = {
      testId: test.testId,
      jobId: test.jobId,
      title: test.title,
      description: test.description,
      instructions: test.instructions,
      type: test.type,
      timeLimit: test.timeLimit,
      passingScore: test.passingScore,
      questionCount: questions.length,
      totalPoints,
      isActive: test.isActive,
      allowRetakes: test.allowRetakes,
      maxAttempts: test.maxAttempts,
      createdBy: test.createdBy,
      createdAt: test.createdAt,
      settings: test.settings
    };

    return createResponse(201, {
      success: true,
      data: {
        test: responseTest
      },
      message: 'Test created successfully'
    });

  } catch (error) {
    logger.error('Failed to create test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create test'
      }
    });
  }
};

export default handler;
