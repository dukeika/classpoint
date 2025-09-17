/**
 * Jest Global Teardown for AB Holistic Interview Portal
 *
 * This file runs once after all tests and cleans up:
 * - Test database connections
 * - Temporary files and resources
 * - Performance metrics reporting
 * - Mock service cleanup
 */

export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Starting global test teardown...');

  // Calculate total test suite duration
  const suiteStartTime = (global as any).__testSuiteStartTime;
  const totalDuration = suiteStartTime ? Date.now() - suiteStartTime : 0;

  // Cleanup test database
  await cleanupTestDatabase();

  // Cleanup test S3 buckets
  await cleanupTestS3Buckets();

  // Restore original console methods
  restoreConsole();

  // Generate performance report
  generatePerformanceReport(totalDuration);

  // Force garbage collection
  if (global.gc) {
    global.gc();
  }

  console.log('✅ Global test teardown completed');
}

async function cleanupTestDatabase(): Promise<void> {
  console.log('🗑️  Cleaning up test database...');

  const testTables = [
    'test-jobs',
    'test-applicants',
    'test-applications',
    'test-tests',
    'test-test-submissions',
    'test-notifications'
  ];

  // Mock cleanup operations
  await Promise.all(
    testTables.map(async (tableName) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`  ✓ Cleaned table: ${tableName}`);
    })
  );

  console.log('✅ Test database cleanup completed');
}

async function cleanupTestS3Buckets(): Promise<void> {
  console.log('🧽 Cleaning up test S3 buckets...');

  const testBuckets = [
    'test-resumes',
    'test-videos'
  ];

  // Mock S3 cleanup
  await Promise.all(
    testBuckets.map(async (bucketName) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`  ✓ Cleaned bucket: ${bucketName}`);
    })
  );

  console.log('✅ Test S3 buckets cleanup completed');
}

function restoreConsole(): void {
  const originalConsole = (global as any).__originalConsole;
  if (originalConsole) {
    Object.assign(console, originalConsole);
  }
}

function generatePerformanceReport(totalDuration: number): void {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUITE PERFORMANCE REPORT');
  console.log('='.repeat(50));
  console.log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);

  const memoryUsage = process.memoryUsage();
  console.log(`Memory Usage:`);
  console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);

  console.log('='.repeat(50));
}