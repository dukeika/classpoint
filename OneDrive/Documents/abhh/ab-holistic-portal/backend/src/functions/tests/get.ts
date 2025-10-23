import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import { UserRole, Test } from '../../types';

const logger = new Logger('TestsGet');
const dbService = DatabaseService.getInstance();

/**
 * Get Test Handler
 *
 * SECURITY: Requires authentication
 * - Admins can view full test with correct answers
 * - Applicants can view test without correct answers (only during active attempt)
 *
 * Features:
 * - Retrieve test details
 * - Verify test availability
 * - Check attempt limits
 * - Role-based data filtering
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Get test request received', {
    requestId: context.awsRequestId,
    testId: event.pathParameters?.id
  });

  try {
    // SECURITY: Verify authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized test access attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access tests'
        }
      });
    }

    const userId = authContext.userId || authContext.principalId;
    const userRole = authContext.role as UserRole;

    // Extract test ID from path
    const testId = event.pathParameters?.id;
    if (!testId) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Test ID is required'
        }
      });
    }

    logger.info('Fetching test', {
      testId,
      userId,
      userRole
    });

    // Get test from database
    const test = await dbService.getItem<Test>(
      process.env.TESTS_TABLE!,
      { testId }
    );

    if (!test) {
      logger.warn('Test not found', { testId });
      return createResponse(404, {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Test not found'
        }
      });
    }

    // Check if test is active
    if (!test.isActive && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      logger.warn('Applicant attempting to access inactive test', {
        testId,
        userId
      });
      return createResponse(403, {
        success: false,
        error: {
          code: 'TEST_NOT_AVAILABLE',
          message: 'This test is not currently available'
        }
      });
    }

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    // For applicants, check attempt limits
    let previousAttempts = 0;
    let canAttempt = true;

    if (!isAdmin) {
      // Get previous submission attempts
      const submissions = await dbService.query(
        process.env.TEST_SUBMISSIONS_TABLE!,
        'GSI1PK = :testApplicant',
        {
          indexName: 'TestApplicantIndex',
          expressionAttributeValues: {
            ':testApplicant': `TEST#${testId}#APPLICANT#${userId}`
          }
        }
      );

      previousAttempts = submissions.count;
      canAttempt = test.allowRetakes && previousAttempts < test.maxAttempts;

      if (!canAttempt) {
        logger.warn('Applicant exceeded attempt limit', {
          testId,
          userId,
          attempts: previousAttempts,
          maxAttempts: test.maxAttempts
        });
        return createResponse(403, {
          success: false,
          error: {
            code: 'ATTEMPT_LIMIT_EXCEEDED',
            message: `You have reached the maximum number of attempts (${test.maxAttempts}) for this test`
          }
        });
      }
    }

    // Prepare response based on user role
    let responseTest: any;

    if (isAdmin) {
      // Admins get full test with correct answers
      responseTest = {
        testId: test.testId,
        jobId: test.jobId,
        title: test.title,
        description: test.description,
        instructions: test.instructions,
        type: test.type,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        questions: test.questions, // Full questions with answers
        isActive: test.isActive,
        allowRetakes: test.allowRetakes,
        maxAttempts: test.maxAttempts,
        createdBy: test.createdBy,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
        settings: test.settings
      };
    } else {
      // Applicants get test without correct answers
      responseTest = {
        testId: test.testId,
        jobId: test.jobId,
        title: test.title,
        description: test.description,
        instructions: test.instructions,
        type: test.type,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        questionCount: test.questions.length,
        questions: test.questions.map(q => ({
          questionId: q.questionId,
          type: q.type,
          text: q.text,
          instructions: q.instructions,
          options: q.options,
          // SECURITY: Don't include correct answers or points for applicants
          timeLimit: q.timeLimit,
          required: q.required,
          orderIndex: q.orderIndex,
          metadata: q.metadata ? {
            programmingLanguage: q.metadata.programmingLanguage,
            starterCode: q.metadata.starterCode,
            // Only include public test cases
            testCases: q.metadata.testCases?.filter(tc => tc.isPublic)
          } : undefined
        })),
        isActive: test.isActive,
        allowRetakes: test.allowRetakes,
        maxAttempts: test.maxAttempts,
        remainingAttempts: test.maxAttempts - previousAttempts,
        settings: {
          shuffleQuestions: test.settings.shuffleQuestions,
          shuffleOptions: test.settings.shuffleOptions,
          showResultsImmediately: test.settings.showResultsImmediately,
          allowReviewAnswers: test.settings.allowReviewAnswers,
          preventCheating: test.settings.preventCheating,
          requireWebcam: test.settings.requireWebcam,
          fullScreenMode: test.settings.fullScreenMode,
          disableCopyPaste: test.settings.disableCopyPaste
        }
      };

      // Shuffle questions if configured
      if (test.settings.shuffleQuestions) {
        responseTest.questions = shuffleArray(responseTest.questions);
      }

      // Shuffle options if configured
      if (test.settings.shuffleOptions) {
        responseTest.questions = responseTest.questions.map((q: any) => ({
          ...q,
          options: q.options ? shuffleArray([...q.options]) : q.options
        }));
      }
    }

    logger.info('Test retrieved successfully', {
      testId,
      userId,
      userRole,
      questionCount: test.questions.length,
      previousAttempts
    });

    return createResponse(200, {
      success: true,
      data: {
        test: responseTest,
        canAttempt,
        previousAttempts
      },
      message: 'Test retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to retrieve test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      testId: event.pathParameters?.id
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve test'
      }
    });
  }
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default handler;
