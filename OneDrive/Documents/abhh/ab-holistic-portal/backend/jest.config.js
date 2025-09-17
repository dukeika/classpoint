/**
 * Jest Configuration for AB Holistic Interview Portal Backend
 *
 * This configuration provides:
 * - TypeScript support
 * - Coverage reporting
 * - Test environment setup
 * - Module path mapping
 * - Performance monitoring
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support
  preset: 'ts-jest',

  // Root directory
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/utils/test-setup.ts'
  ],

  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@functions/(.*)$': '<rootDir>/src/functions/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // File extensions to recognize
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/types/**',
    '!src/**/*.config.ts'
  ],

  // Test timeout
  testTimeout: 30000,

  // Global setup/teardown
  globalSetup: '<rootDir>/src/utils/test-global-setup.ts',
  globalTeardown: '<rootDir>/src/utils/test-global-teardown.ts',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance monitoring
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml'
    }]
  ],

  // Module directories
  moduleDirectories: ['node_modules', 'src'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.serverless/'
  ],

  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.serverless/',
    '<rootDir>/coverage/'
  ],

  // Maximum worker processes
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache'
};