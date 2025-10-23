import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import {
  UserRole,
  Test,
  TestSubmission,
  SubmitTestRequest,
  TestAnswer,
  QuestionType,
  ApplicationStage
} from '../../types';
import { validateRequest } from '../../utils/validation';

const logger = new Logger('TestsSubmit');
const dbService = DatabaseService.getInstance();

/**
 * Submit Test Handler
 *
 * SECURITY: Requires applicant authentication
 * Applicants submit their test responses for grading
 *
 * Features:
 * - Validate test submission
 * - Auto-grade multiple choice questions
 * - Calculate total score
 * - Update application stage if passed
 * - Store submission for review
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Submit test request received', {
    requestId: context.awsRequestId,
    testId: event.pathParameters?.id
  });

  try {
    // SECURITY: Verify authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized test submission attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to submit tests'
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

    // Validate request body
    const validationResult = validateRequest<SubmitTestRequest>(event.body, {
      answers: { required: true, type: 'array', minLength: 1 },
      timeSpent: { required: true, type: 'number', min: 0 },
      browserInfo: { required: false, type: 'string' }
    });

    if (!validationResult.isValid) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid submission data',
          details: validationResult.errors
        }
      });
    }

    const submissionData = validationResult.data!;

    logger.info('Processing test submission', {
      testId,
      userId,
      answerCount: submissionData.answers.length,
      timeSpent: submissionData.timeSpent
    });

    // Get test from database
    const test = await dbService.getItem<Test>(
      process.env.TESTS_TABLE!,
      { testId }
    );

    if (!test) {
      logger.warn('Test not found for submission', { testId });
      return createResponse(404, {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Test not found'
        }
      });
    }

    if (!test.isActive) {
      logger.warn('Attempt to submit inactive test', { testId, userId });
      return createResponse(403, {
        success: false,
        error: {
          code: 'TEST_NOT_AVAILABLE',
          message: 'This test is not currently accepting submissions'
        }
      });
    }

    // Check attempt limits
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

    const attemptNumber = submissions.count + 1;

    if (attemptNumber > test.maxAttempts) {
      logger.warn('Attempt limit exceeded', {
        testId,
        userId,
        attemptNumber,
        maxAttempts: test.maxAttempts
      });
      return createResponse(403, {
        success: false,
        error: {
          code: 'ATTEMPT_LIMIT_EXCEEDED',
          message: `Maximum attempts (${test.maxAttempts}) exceeded`
        }
      });
    }

    // Find the application for this test
    const application = await findApplicationForTest(userId, test.jobId);
    if (!application) {
      logger.warn('No application found for test submission', {
        testId,
        userId,
        jobId: test.jobId
      });
      return createResponse(404, {
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'You must have an active application to submit this test'
        }
      });
    }

    // Grade the submission
    const gradedAnswers = await gradeAnswers(test, submissionData.answers);
    const totalScore = gradedAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const maxScore = gradedAnswers.reduce((sum, answer) => sum + answer.maxScore, 0);
    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentageScore >= (test.passingScore || 70);

    // Create submission record
    const submissionId = uuidv4();
    const now = dbService.getTimestamp();

    const submission: TestSubmission & Record<string, any> = {
      submissionId,
      testId,
      applicantId: userId,
      applicationId: application.applicationId,
      startedAt: now, // In a real app, this would be tracked from when they started
      submittedAt: now,
      timeSpent: submissionData.timeSpent,
      answers: gradedAnswers,
      score: totalScore,
      maxScore,
      passed,
      graded: true, // Auto-graded
      attemptNumber,
      browserInfo: submissionData.browserInfo,
      ipAddress: event.requestContext.identity.sourceIp,

      // DynamoDB metadata
      EntityType: 'TestSubmission',
      GSI1PK: `TEST#${testId}#APPLICANT#${userId}`,
      GSI1SK: `ATTEMPT#${attemptNumber}#${now}`,
      createdAt: now,
      updatedAt: now
    };

    // Save submission
    await dbService.putItem(
      process.env.TEST_SUBMISSIONS_TABLE!,
      submission
    );

    logger.info('Test submission graded', {
      submissionId,
      testId,
      userId,
      score: totalScore,
      maxScore,
      percentageScore: percentageScore.toFixed(2),
      passed,
      attemptNumber
    });

    // If passed, update application stage
    if (passed) {
      await updateApplicationStageAfterTest(
        application.applicationId,
        test.type,
        userId,
        percentageScore
      );

      logger.info('Application stage updated after passing test', {
        applicationId: application.applicationId,
        testType: test.type,
        score: percentageScore
      });
    }

    // Prepare response
    const response: any = {
      submissionId,
      testId,
      score: totalScore,
      maxScore,
      percentageScore: Math.round(percentageScore * 100) / 100,
      passed,
      passingScore: test.passingScore,
      attemptNumber,
      remainingAttempts: test.maxAttempts - attemptNumber,
      submittedAt: now
    };

    // Include detailed results if configured
    if (test.settings.showResultsImmediately) {
      response.answers = gradedAnswers.map(answer => ({
        questionId: answer.questionId,
        score: answer.score,
        maxScore: answer.maxScore,
        feedback: answer.feedback
      }));
    }

    return createResponse(200, {
      success: true,
      data: {
        submission: response
      },
      message: passed
        ? `Test submitted successfully! You scored ${percentageScore.toFixed(1)}% and passed.`
        : `Test submitted. You scored ${percentageScore.toFixed(1)}%. Passing score is ${test.passingScore}%.`
    });

  } catch (error) {
    logger.error('Failed to submit test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      testId: event.pathParameters?.id
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit test'
      }
    });
  }
};

/**
 * Grade test answers
 */
async function gradeAnswers(test: Test, submittedAnswers: any[]): Promise<TestAnswer[]> {
  const gradedAnswers: TestAnswer[] = [];

  for (const submittedAnswer of submittedAnswers) {
    const question = test.questions.find(q => q.questionId === submittedAnswer.questionId);

    if (!question) {
      logger.warn('Answer submitted for unknown question', {
        questionId: submittedAnswer.questionId
      });
      continue;
    }

    const gradedAnswer: TestAnswer = {
      questionId: submittedAnswer.questionId,
      response: submittedAnswer.response,
      submittedAt: submittedAnswer.submittedAt || dbService.getTimestamp(),
      timeSpent: submittedAnswer.timeSpent,
      score: 0,
      maxScore: Number(question.points),
      metadata: submittedAnswer.metadata
    };

    // Auto-grade multiple choice questions
    if (question.type === QuestionType.MULTIPLE_CHOICE && question.correctAnswer) {
      const isCorrect = Array.isArray(question.correctAnswer)
        ? arraysEqual(submittedAnswer.response, question.correctAnswer)
        : submittedAnswer.response === question.correctAnswer;

      if (isCorrect) {
        gradedAnswer.score = Number(question.points);
        gradedAnswer.feedback = 'Correct!';
      } else {
        gradedAnswer.score = 0;
        gradedAnswer.feedback = 'Incorrect';
      }
    } else {
      // Other question types need manual grading
      gradedAnswer.feedback = 'Pending manual review';
    }

    gradedAnswers.push(gradedAnswer);
  }

  return gradedAnswers;
}

/**
 * Find application for test
 */
async function findApplicationForTest(applicantId: string, jobId: string): Promise<any> {
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

    return result.items[0] || null;
  } catch (error) {
    logger.error('Error finding application', { error, applicantId, jobId });
    return null;
  }
}

/**
 * Update application stage after passing test
 */
async function updateApplicationStageAfterTest(
  applicationId: string,
  testType: string,
  userId: string,
  score: number
): Promise<void> {
  try {
    // Determine next stage based on test type
    let nextStage: ApplicationStage;

    if (testType === 'written') {
      nextStage = ApplicationStage.VIDEO_TEST;
    } else if (testType === 'video') {
      nextStage = ApplicationStage.FIRST_INTERVIEW;
    } else {
      nextStage = ApplicationStage.FIRST_INTERVIEW;
    }

    const now = dbService.getTimestamp();

    await dbService.updateItem(
      process.env.APPLICATIONS_TABLE!,
      { applicationId },
      {
        updateExpression: 'SET stage = :stage, stageHistory = list_append(stageHistory, :newHistory), GSI1SK = :gsi1sk',
        expressionAttributeValues: {
          ':stage': nextStage,
          ':newHistory': [{
            stage: nextStage,
            changedBy: userId,
            changedAt: now,
            comments: `Automatically advanced after passing ${testType} test with score ${score.toFixed(1)}%`,
            automaticTransition: true
          }],
          ':gsi1sk': `STAGE#${nextStage}#${now}`
        }
      }
    );

    logger.info('Application stage updated automatically', {
      applicationId,
      nextStage,
      testType,
      score
    });
  } catch (error) {
    logger.error('Failed to update application stage', {
      error,
      applicationId,
      testType
    });
    // Don't throw - test submission should still succeed
  }
}

/**
 * Compare arrays for equality
 */
function arraysEqual(a: any[], b: any[]): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

export default handler;
