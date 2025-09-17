/**
 * Jest Test Setup for AB Holistic Interview Portal
 *
 * This file configures the test environment with:
 * - Environment variables
 * - AWS SDK mocking
 * - Global test utilities
 * - Performance monitoring
 * - Custom matchers
 */

import { jest } from '@jest/globals';

// ========================================
// Environment Variables Setup
// ========================================

process.env.NODE_ENV = 'test';
process.env.STAGE = 'test';
process.env.REGION = 'us-west-1';
process.env.LOG_LEVEL = 'DEBUG';

// Database configuration
process.env.JOBS_TABLE = 'test-jobs';
process.env.APPLICANTS_TABLE = 'test-applicants';
process.env.APPLICATIONS_TABLE = 'test-applications';
process.env.TESTS_TABLE = 'test-tests';
process.env.TEST_SUBMISSIONS_TABLE = 'test-test-submissions';
process.env.NOTIFICATIONS_TABLE = 'test-notifications';

// S3 configuration
process.env.S3_BUCKET_RESUMES = 'test-resumes';
process.env.S3_BUCKET_VIDEOS = 'test-videos';

// Authentication configuration
process.env.USER_POOL_ID = 'test-user-pool';
process.env.USER_POOL_WEB_CLIENT_ID = 'test-client-id';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

// Security configuration
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// ========================================
// AWS SDK Mocking
// ========================================

// Mock AWS SDK v3 clients
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn()
    })
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://example.com/presigned-url')
}));

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InitiateAuthCommand: jest.fn(),
  AuthFlowType: {
    USER_PASSWORD_AUTH: 'USER_PASSWORD_AUTH'
  }
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  SendEmailCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PublishCommand: jest.fn()
}));

// ========================================
// Global Test Utilities
// ========================================

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidISODateTime(): R;
      toHaveValidApiResponseStructure(): R;
      toBeWithinTimeRange(start: Date, end: Date): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toBeValidISODateTime(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received === date.toISOString();

    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid ISO date time`
          : `Expected ${received} to be a valid ISO date time`,
      pass,
    };
  },

  toHaveValidApiResponseStructure(received: object) {
    const requiredFields = ['success', 'timestamp'];
    const hasRequiredFields = requiredFields.every(field => field in received);

    const hasSuccessField = typeof (received as any).success === 'boolean';
    const hasTimestampField = typeof (received as any).timestamp === 'string';

    const pass = hasRequiredFields && hasSuccessField && hasTimestampField;

    return {
      message: () =>
        pass
          ? `Expected object not to have valid API response structure`
          : `Expected object to have valid API response structure with 'success' (boolean) and 'timestamp' (string) fields`,
      pass,
    };
  },

  toBeWithinTimeRange(received: Date, start: Date, end: Date) {
    const pass = received >= start && received <= end;

    return {
      message: () =>
        pass
          ? `Expected ${received.toISOString()} not to be within range ${start.toISOString()} - ${end.toISOString()}`
          : `Expected ${received.toISOString()} to be within range ${start.toISOString()} - ${end.toISOString()}`,
      pass,
    };
  },
});

// ========================================
// Global Test Configuration
// ========================================

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Console warnings and errors configuration
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// ========================================
// Performance Monitoring
// ========================================

interface PerformanceMetrics {
  testName: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
}

const performanceMetrics: PerformanceMetrics[] = [];

beforeEach(() => {
  // Record test start time and memory
  const currentTest = expect.getState();
  (global as any).__testStartTime = Date.now();
  (global as any).__testStartMemory = process.memoryUsage();
});

afterEach(() => {
  // Record test performance metrics
  const currentTest = expect.getState();
  const testName = currentTest.currentTestName || 'unknown';
  const startTime = (global as any).__testStartTime;
  const startMemory = (global as any).__testStartMemory;

  if (startTime && startMemory) {
    const duration = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();

    performanceMetrics.push({
      testName,
      duration,
      memoryUsage: {
        rss: memoryUsage.rss - startMemory.rss,
        heapTotal: memoryUsage.heapTotal - startMemory.heapTotal,
        heapUsed: memoryUsage.heapUsed - startMemory.heapUsed,
        external: memoryUsage.external - startMemory.external,
        arrayBuffers: memoryUsage.arrayBuffers - startMemory.arrayBuffers
      }
    });

    // Warn about slow tests
    if (duration > 5000) {
      console.warn(`Slow test detected: ${testName} took ${duration}ms`);
    }

    // Warn about high memory usage
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsedMB > 50) {
      console.warn(`High memory usage: ${testName} used ${memoryUsedMB.toFixed(2)}MB`);
    }
  }
});

// ========================================
// Global Test Helpers
// ========================================

// Make test helpers available globally
import * as TestHelpers from './test-helpers';

(global as any).TestHelpers = TestHelpers;

// Add utility functions to global scope
(global as any).mockEnvironment = (overrides: Record<string, string>) => {
  Object.entries(overrides).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

(global as any).restoreEnvironment = () => {
  // This would restore original environment variables
  // Implementation depends on your needs
};

(global as any).flushPromises = () => new Promise(resolve => setImmediate(resolve));

// ========================================
// Database Test Setup
// ========================================

beforeEach(() => {
  // Clear test database state
  TestHelpers.DatabaseTestHelper.clearData();
  TestHelpers.DatabaseTestHelper.setupTestTables();
});

// ========================================
// Mock Data Helpers
// ========================================

// Create commonly used mock data that's available in all tests
(global as any).createMockUser = TestHelpers.MockDataFactory.createUser;
(global as any).createMockJob = TestHelpers.MockDataFactory.createJob;
(global as any).createMockApplication = TestHelpers.MockDataFactory.createApplication;

// ========================================
// Error Handling
// ========================================

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  throw reason;
});

// ========================================
// Cleanup
// ========================================

afterAll(() => {
  // Log performance metrics summary
  if (performanceMetrics.length > 0) {
    const totalDuration = performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const averageDuration = totalDuration / performanceMetrics.length;
    const slowestTest = performanceMetrics.reduce((max, metric) =>
      metric.duration > max.duration ? metric : max
    );

    console.log('\n=== Test Performance Summary ===');
    console.log(`Total tests: ${performanceMetrics.length}`);
    console.log(`Total duration: ${totalDuration}ms`);
    console.log(`Average duration: ${averageDuration.toFixed(2)}ms`);
    console.log(`Slowest test: ${slowestTest.testName} (${slowestTest.duration}ms)`);
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});