/**
 * Jest Global Setup for AB Holistic Interview Portal
 *
 * This file runs once before all tests and sets up:
 * - Test database connections
 * - Global test configuration
 * - Performance monitoring initialization
 * - Mock service initialization
 */

import { jest } from '@jest/globals';

export default async function globalSetup(): Promise<void> {
  console.log('🚀 Starting global test setup...');

  // Set global test environment
  process.env.NODE_ENV = 'test';
  process.env.AWS_REGION = 'us-west-1';

  // Initialize performance monitoring
  (global as any).__testSuiteStartTime = Date.now();

  // Mock external services at global level
  setupGlobalMocks();

  // Initialize test database if needed
  await initializeTestDatabase();

  // Setup test S3 buckets
  await setupTestS3Buckets();

  // Warm up test environment
  await warmupTestEnvironment();

  console.log('✅ Global test setup completed');
}

function setupGlobalMocks(): void {
  // Mock console methods to reduce noise in test output
  const originalConsole = { ...console };

  (global as any).__originalConsole = originalConsole;

  // Only log errors and warnings in test mode
  if (process.env.JEST_VERBOSE !== 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  }

  // Mock setTimeout and setInterval for deterministic tests
  jest.useFakeTimers();
}

async function initializeTestDatabase(): Promise<void> {
  // In a real implementation, this would:
  // 1. Create test DynamoDB tables
  // 2. Set up initial test data
  // 3. Configure database connections

  console.log('📊 Initializing test database...');

  // Mock implementation - would connect to actual test database
  const testTables = [
    'test-jobs',
    'test-applicants',
    'test-applications',
    'test-tests',
    'test-test-submissions',
    'test-notifications'
  ];

  // Simulate table creation
  await Promise.all(
    testTables.map(async (tableName) => {
      // Mock table creation delay
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`  ✓ Created table: ${tableName}`);
    })
  );

  console.log('✅ Test database initialized');
}

async function setupTestS3Buckets(): Promise<void> {
  console.log('🪣 Setting up test S3 buckets...');

  const testBuckets = [
    'test-resumes',
    'test-videos'
  ];

  // Mock S3 bucket setup
  await Promise.all(
    testBuckets.map(async (bucketName) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`  ✓ Created bucket: ${bucketName}`);
    })
  );

  console.log('✅ Test S3 buckets setup completed');
}

async function warmupTestEnvironment(): Promise<void> {
  console.log('🔥 Warming up test environment...');

  // Simulate some warmup operations
  await Promise.all([
    // Warm up AWS clients
    new Promise(resolve => setTimeout(resolve, 50)),
    // Initialize caches
    new Promise(resolve => setTimeout(resolve, 30)),
    // Preload test data
    new Promise(resolve => setTimeout(resolve, 20))
  ]);

  console.log('✅ Test environment warmed up');
}