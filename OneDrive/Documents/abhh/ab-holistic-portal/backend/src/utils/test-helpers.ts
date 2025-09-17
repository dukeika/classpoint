/**
 * Testing Utilities and Helpers for AB Holistic Interview Portal
 *
 * This module provides:
 * - Mock data factories
 * - Test utilities for Lambda functions
 * - Database test helpers
 * - Authentication test utilities
 * - API testing helpers
 * - Performance testing utilities
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  User,
  Job,
  Application,
  Test,
  TestSubmission,
  UserRole,
  JobStatus,
  ApplicationStage,
  TestType,
  UUID,
  ISODateTime,
  LoginRequest,
  CreateJobRequest,
  CreateApplicationRequest
} from '../types';

// ========================================
// Mock Data Factories
// ========================================

export class MockDataFactory {
  private static idCounter = 1;

  /**
   * Generate a mock UUID
   */
  static generateUUID(): UUID {
    return `00000000-0000-4000-8000-${(this.idCounter++).toString().padStart(12, '0')}`;
  }

  /**
   * Generate a mock ISO datetime
   */
  static generateISODateTime(offsetDays: number = 0): ISODateTime {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  }

  /**
   * Create a mock user
   */
  static createUser(overrides: Partial<User> = {}): User {
    return {
      userId: this.generateUUID(),
      email: `user${this.idCounter}@example.com`,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.APPLICANT,
      status: 'active',
      createdAt: this.generateISODateTime(-30),
      updatedAt: this.generateISODateTime(-1),
      emailVerified: true,
      ...overrides
    };
  }

  /**
   * Create a mock admin user
   */
  static createAdmin(overrides: Partial<User> = {}): User {
    return this.createUser({
      role: UserRole.ADMIN,
      email: `admin${this.idCounter}@company.com`,
      ...overrides
    });
  }

  /**
   * Create a mock job
   */
  static createJob(overrides: Partial<Job> = {}): Job {
    return {
      jobId: this.generateUUID(),
      title: 'Software Engineer',
      description: 'We are looking for a talented software engineer...',
      requirements: ['3+ years experience', 'JavaScript', 'Node.js'],
      responsibilities: ['Develop applications', 'Code reviews'],
      qualifications: ['Bachelor\'s degree', 'Problem-solving skills'],
      department: 'Engineering',
      location: 'San Francisco, CA',
      remotePolicy: 'hybrid',
      jobType: 'full_time',
      status: JobStatus.PUBLISHED,
      skills: ['JavaScript', 'TypeScript', 'React'],
      experienceLevel: 'mid',
      createdBy: this.generateUUID(),
      createdAt: this.generateISODateTime(-7),
      updatedAt: this.generateISODateTime(-1),
      publishedAt: this.generateISODateTime(-5),
      ...overrides
    };
  }

  /**
   * Create a mock application
   */
  static createApplication(overrides: Partial<Application> = {}): Application {
    return {
      applicationId: this.generateUUID(),
      jobId: this.generateUUID(),
      applicantId: this.generateUUID(),
      stage: ApplicationStage.APPLIED,
      status: 'active',
      coverLetter: 'I am very interested in this position...',
      resumeUrl: 'https://example.com/resume.pdf',
      appliedAt: this.generateISODateTime(-3),
      updatedAt: this.generateISODateTime(-1),
      stageHistory: [{
        stage: ApplicationStage.APPLIED,
        changedBy: this.generateUUID(),
        changedAt: this.generateISODateTime(-3),
        automaticTransition: false
      }],
      priority: 'medium',
      notes: [],
      scores: [],
      ...overrides
    };
  }

  /**
   * Create a mock test
   */
  static createTest(overrides: Partial<Test> = {}): Test {
    return {
      testId: this.generateUUID(),
      jobId: this.generateUUID(),
      title: 'Technical Assessment',
      description: 'Test your technical skills',
      instructions: 'Please answer all questions',
      type: TestType.WRITTEN,
      timeLimit: 60,
      questions: [
        {
          questionId: this.generateUUID(),
          type: 'multiple_choice',
          text: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'Paris',
          points: 1,
          required: true,
          orderIndex: 0
        }
      ],
      isActive: true,
      allowRetakes: false,
      maxAttempts: 1,
      createdBy: this.generateUUID(),
      createdAt: this.generateISODateTime(-5),
      updatedAt: this.generateISODateTime(-1),
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultsImmediately: false,
        allowReviewAnswers: true,
        preventCheating: false,
        requireWebcam: false,
        fullScreenMode: false,
        disableCopyPaste: false
      },
      ...overrides
    };
  }

  /**
   * Create a mock test submission
   */
  static createTestSubmission(overrides: Partial<TestSubmission> = {}): TestSubmission {
    return {
      submissionId: this.generateUUID(),
      testId: this.generateUUID(),
      applicantId: this.generateUUID(),
      applicationId: this.generateUUID(),
      startedAt: this.generateISODateTime(-1),
      submittedAt: this.generateISODateTime(),
      timeSpent: 1800, // 30 minutes
      answers: [{
        questionId: this.generateUUID(),
        response: 'Paris',
        timeSpent: 30,
        submittedAt: this.generateISODateTime(),
        score: 1,
        maxScore: 1
      }],
      score: 1,
      maxScore: 1,
      passed: true,
      graded: true,
      attemptNumber: 1,
      ...overrides
    };
  }

  /**
   * Create mock login request
   */
  static createLoginRequest(overrides: Partial<LoginRequest> = {}): LoginRequest {
    return {
      email: 'test@example.com',
      password: 'TestPassword123!',
      ...overrides
    };
  }

  /**
   * Create mock job creation request
   */
  static createJobRequest(overrides: Partial<CreateJobRequest> = {}): CreateJobRequest {
    return {
      title: 'Software Engineer',
      description: 'We are looking for a talented software engineer...',
      requirements: ['3+ years experience', 'JavaScript', 'Node.js'],
      responsibilities: ['Develop applications', 'Code reviews'],
      qualifications: ['Bachelor\'s degree', 'Problem-solving skills'],
      department: 'Engineering',
      location: 'San Francisco, CA',
      remotePolicy: 'hybrid',
      jobType: 'full_time',
      skills: ['JavaScript', 'TypeScript', 'React'],
      experienceLevel: 'mid',
      ...overrides
    };
  }

  /**
   * Create mock application request
   */
  static createApplicationRequest(overrides: Partial<CreateApplicationRequest> = {}): CreateApplicationRequest {
    return {
      jobId: this.generateUUID(),
      coverLetter: 'I am very interested in this position...',
      resumeUrl: 'https://example.com/resume.pdf',
      ...overrides
    };
  }
}

// ========================================
// Lambda Event Builders
// ========================================

export class EventBuilder {
  /**
   * Create a mock API Gateway event
   */
  static createAPIGatewayEvent(
    overrides: Partial<APIGatewayProxyEvent> = {}
  ): APIGatewayProxyEvent {
    return {
      body: null,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-agent',
      },
      multiValueHeaders: {},
      httpMethod: 'GET',
      isBase64Encoded: false,
      path: '/test',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '123456789012',
        apiId: 'test-api',
        authorizer: {},
        protocol: 'HTTP/1.1',
        httpMethod: 'GET',
        path: '/test',
        stage: 'test',
        requestId: 'test-request-id',
        requestTime: '09/Apr/2015:12:34:56 +0000',
        requestTimeEpoch: 1428582896000,
        resourceId: 'test-resource',
        resourcePath: '/test',
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: '127.0.0.1',
          user: null,
          userAgent: 'test-agent',
          userArn: null,
          clientCert: null,
        },
      },
      resource: '/test',
      ...overrides,
    };
  }

  /**
   * Create a POST event with body
   */
  static createPOSTEvent<T>(
    path: string,
    body: T,
    overrides: Partial<APIGatewayProxyEvent> = {}
  ): APIGatewayProxyEvent {
    return this.createAPIGatewayEvent({
      httpMethod: 'POST',
      path,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...overrides.headers,
      },
      ...overrides,
    });
  }

  /**
   * Create a GET event with query parameters
   */
  static createGETEvent(
    path: string,
    queryParams: Record<string, string> = {},
    overrides: Partial<APIGatewayProxyEvent> = {}
  ): APIGatewayProxyEvent {
    return this.createAPIGatewayEvent({
      httpMethod: 'GET',
      path,
      queryStringParameters: queryParams,
      ...overrides,
    });
  }

  /**
   * Create an authenticated event with user context
   */
  static createAuthenticatedEvent<T>(
    httpMethod: string,
    path: string,
    user: User,
    body?: T,
    overrides: Partial<APIGatewayProxyEvent> = {}
  ): APIGatewayProxyEvent {
    return this.createAPIGatewayEvent({
      httpMethod,
      path,
      body: body ? JSON.stringify(body) : null,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-jwt-token`,
        ...overrides.headers,
      },
      requestContext: {
        ...this.createAPIGatewayEvent().requestContext,
        authorizer: {
          userId: user.userId,
          role: user.role,
          permissions: isAdmin(user) ? user.permissions : [],
        },
        ...overrides.requestContext,
      },
      ...overrides,
    });
  }
}

// ========================================
// Lambda Context Builder
// ========================================

export class ContextBuilder {
  /**
   * Create a mock Lambda context
   */
  static create(overrides: Partial<Context> = {}): Context {
    return {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2021/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
      ...overrides,
    };
  }
}

// ========================================
// Database Test Helpers
// ========================================

export class DatabaseTestHelper {
  private static testData: Map<string, unknown[]> = new Map();

  /**
   * Mock DynamoDB operations for testing
   */
  static mockDynamoDB() {
    // This would mock AWS SDK calls in a real implementation
    // For now, we'll use an in-memory store
  }

  /**
   * Seed test data
   */
  static seedData(tableName: string, items: unknown[]): void {
    this.testData.set(tableName, items);
  }

  /**
   * Get test data
   */
  static getData(tableName: string): unknown[] {
    return this.testData.get(tableName) || [];
  }

  /**
   * Clear test data
   */
  static clearData(tableName?: string): void {
    if (tableName) {
      this.testData.delete(tableName);
    } else {
      this.testData.clear();
    }
  }

  /**
   * Create test tables setup
   */
  static setupTestTables(): void {
    const tables = [
      'jobs',
      'applications',
      'users',
      'tests',
      'test-submissions',
      'notifications'
    ];

    tables.forEach(table => {
      this.testData.set(table, []);
    });
  }
}

// ========================================
// Authentication Test Helpers
// ========================================

export class AuthTestHelper {
  /**
   * Create a mock JWT token
   */
  static createMockJWT(user: User): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      sub: user.userId,
      email: user.email,
      role: user.role,
      permissions: isAdmin(user) ? user.permissions : [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iss: 'test-issuer',
      aud: 'test-audience'
    })).toString('base64');
    const signature = 'mock-signature';

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Mock Cognito authentication
   */
  static mockCognitoAuth(email: string, password: string): {
    AuthenticationResult?: {
      AccessToken: string;
      RefreshToken: string;
      IdToken: string;
    };
  } {
    if (email === 'valid@example.com' && password === 'ValidPassword123!') {
      const user = MockDataFactory.createUser({ email });
      return {
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: this.createMockJWT(user)
        }
      };
    }

    throw new Error('NotAuthorizedException');
  }
}

// ========================================
// API Test Helpers
// ========================================

export class APITestHelper {
  /**
   * Test a Lambda handler function
   */
  static async testHandler<TRequest, TResponse>(
    handler: (event: APIGatewayProxyEvent, context: Context) => Promise<TResponse>,
    event: APIGatewayProxyEvent,
    context: Context = ContextBuilder.create()
  ): Promise<TResponse> {
    return await handler(event, context);
  }

  /**
   * Assert successful API response
   */
  static assertSuccess<T>(
    response: { statusCode: number; body: string },
    expectedStatusCode: number = 200
  ): T {
    expect(response.statusCode).toBe(expectedStatusCode);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.timestamp).toBeDefined();

    return body.data;
  }

  /**
   * Assert error API response
   */
  static assertError(
    response: { statusCode: number; body: string },
    expectedStatusCode: number,
    expectedErrorCode?: string
  ): void {
    expect(response.statusCode).toBe(expectedStatusCode);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.timestamp).toBeDefined();

    if (expectedErrorCode) {
      expect(body.error.code).toBe(expectedErrorCode);
    }
  }

  /**
   * Test authentication middleware
   */
  static testAuthentication(
    event: APIGatewayProxyEvent,
    expectedRole?: UserRole
  ): void {
    // This would test the authentication middleware
    // Implementation depends on your auth setup
  }
}

// ========================================
// Performance Test Helpers
// ========================================

export class PerformanceTestHelper {
  /**
   * Measure function execution time
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;

    return { result, duration };
  }

  /**
   * Test function performance
   */
  static async testPerformance<T>(
    fn: () => Promise<T>,
    maxDurationMs: number,
    testName: string = 'function'
  ): Promise<T> {
    const { result, duration } = await this.measureExecutionTime(fn);

    if (duration > maxDurationMs) {
      throw new Error(
        `Performance test failed: ${testName} took ${duration}ms, expected under ${maxDurationMs}ms`
      );
    }

    return result;
  }

  /**
   * Load test a function
   */
  static async loadTest<T>(
    fn: () => Promise<T>,
    concurrentCalls: number = 10,
    iterations: number = 5
  ): Promise<{
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successCount: number;
    errorCount: number;
  }> {
    const results: { duration: number; success: boolean }[] = [];

    for (let i = 0; i < iterations; i++) {
      const promises = Array(concurrentCalls).fill(0).map(async () => {
        try {
          const { duration } = await this.measureExecutionTime(fn);
          return { duration, success: true };
        } catch {
          return { duration: 0, success: false };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const successfulResults = results.filter(r => r.success);
    const durations = successfulResults.map(r => r.duration);

    return {
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successCount: successfulResults.length,
      errorCount: results.length - successfulResults.length
    };
  }
}

// ========================================
// Validation Test Helpers
// ========================================

export class ValidationTestHelper {
  /**
   * Test schema validation
   */
  static testValidation<T>(
    schema: Joi.ObjectSchema<T>,
    validData: T,
    invalidData: Partial<T>[]
  ): void {
    // Test valid data
    expect(() => schema.validate(validData)).not.toThrow();

    // Test invalid data
    invalidData.forEach(data => {
      expect(() => {
        const result = schema.validate(data);
        if (result.error) {
          throw result.error;
        }
      }).toThrow();
    });
  }

  /**
   * Test input sanitization
   */
  static testSanitization(
    sanitizer: (input: string) => string,
    testCases: Array<{ input: string; expected: string }>
  ): void {
    testCases.forEach(({ input, expected }) => {
      expect(sanitizer(input)).toBe(expected);
    });
  }
}

// Helper function to check if user is admin
function isAdmin(user: User): user is User & { permissions: string[] } {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
}

// Export all helpers
export {
  MockDataFactory,
  EventBuilder,
  ContextBuilder,
  DatabaseTestHelper,
  AuthTestHelper,
  APITestHelper,
  PerformanceTestHelper,
  ValidationTestHelper
};