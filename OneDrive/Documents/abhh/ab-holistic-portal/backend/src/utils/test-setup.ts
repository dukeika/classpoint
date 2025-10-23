// Global test setup
import 'reflect-metadata';

// Optional: Add global mocking or setup logic
beforeEach(() => {
  // Reset all mocks before each test
  jest.resetAllMocks();
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

// Add any global test utilities or configurations
export const setupTestEnvironment = () => {
  // Custom global test environment setup
  process.env.NODE_ENV = 'test';
};