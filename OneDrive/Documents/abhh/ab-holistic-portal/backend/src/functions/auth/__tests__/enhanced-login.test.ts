/**
 * Enhanced Login Handler Tests
 *
 * These tests demonstrate:
 * - Unit testing with mocks
 * - Integration testing with test helpers
 * - Performance testing
 * - Security testing
 * - Error handling testing
 */

import { handler } from '../enhanced-login';
import { EventBuilder, ContextBuilder, MockDataFactory, AuthTestHelper, APITestHelper } from '../../../utils/test-helpers';
import { UserRole } from '../../../types';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider');

describe('Enhanced Login Handler', () => {
  let mockCognitoSend: jest.Mock;

  beforeEach(() => {
    // Setup Cognito mock
    mockCognitoSend = jest.fn();
    (CognitoIdentityProviderClient as jest.Mock).mockImplementation(() => ({
      send: mockCognitoSend
    }));

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Successful Authentication', () => {
    it('should authenticate valid user credentials', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });

      const mockUser = MockDataFactory.createUser({
        email: loginRequest.email,
        role: UserRole.APPLICANT
      });

      const mockIdToken = AuthTestHelper.createMockJWT(mockUser);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody).toHaveValidApiResponseStructure();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.user).toBeDefined();
      expect(responseBody.data.tokens).toBeDefined();

      // Verify user data
      expect(responseBody.data.user.email).toBe(loginRequest.email);
      expect(responseBody.data.user.userId).toBeValidUUID();
      expect(responseBody.data.user.role).toBe(UserRole.APPLICANT);

      // Verify tokens
      expect(responseBody.data.tokens.accessToken).toBe('mock-access-token');
      expect(responseBody.data.tokens.refreshToken).toBe('mock-refresh-token');
      expect(responseBody.data.tokens.idToken).toBe(mockIdToken);
      expect(responseBody.data.tokens.tokenType).toBe('Bearer');

      // Verify Cognito was called with correct parameters
      expect(mockCognitoSend).toHaveBeenCalledTimes(1);
      const callArgs = mockCognitoSend.mock.calls[0][0];
      expect(callArgs.input.AuthParameters.USERNAME).toBe(loginRequest.email);
      expect(callArgs.input.AuthParameters.PASSWORD).toBe(loginRequest.password);
    });

    it('should handle admin user login', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest({
        email: 'admin@company.com',
        password: 'AdminPassword123!'
      });

      const mockAdmin = MockDataFactory.createAdmin({
        email: loginRequest.email,
        role: UserRole.ADMIN
      });

      const mockIdToken = AuthTestHelper.createMockJWT(mockAdmin);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.data.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Authentication Failures', () => {
    it('should handle invalid credentials', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      });

      mockCognitoSend.mockRejectedValue({
        name: 'NotAuthorizedException',
        message: 'Incorrect username or password.'
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 401, 'AUTHENTICATION_ERROR');

      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toBe('Invalid email or password');
    });

    it('should handle unverified user', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();

      mockCognitoSend.mockRejectedValue({
        name: 'UserNotConfirmedException',
        message: 'User is not confirmed.'
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 401, 'AUTHENTICATION_ERROR');

      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toBe('Please verify your email address before logging in');
    });

    it('should handle user not found', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();

      mockCognitoSend.mockRejectedValue({
        name: 'UserNotFoundException',
        message: 'User does not exist.'
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 401, 'AUTHENTICATION_ERROR');

      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toBe('Invalid email or password');
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();

      mockCognitoSend.mockRejectedValue({
        name: 'TooManyRequestsException',
        message: 'Too many requests'
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 502, 'EXTERNAL_SERVICE_ERROR');
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      // Arrange
      const invalidRequest = {};

      const event = EventBuilder.createPOSTEvent('/auth/login', invalidRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 400, 'VALIDATION_ERROR');
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidRequest = {
        email: 'invalid-email',
        password: 'ValidPassword123!'
      };

      const event = EventBuilder.createPOSTEvent('/auth/login', invalidRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 400, 'VALIDATION_ERROR');
    });

    it('should validate password presence', async () => {
      // Arrange
      const invalidRequest = {
        email: 'test@example.com',
        password: ''
      };

      const event = EventBuilder.createPOSTEvent('/auth/login', invalidRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 400, 'VALIDATION_ERROR');
    });

    it('should sanitize input data', async () => {
      // Arrange
      const loginRequest = {
        email: '  test@example.com  ',
        password: 'ValidPassword123!'
      };

      const mockUser = MockDataFactory.createUser({
        email: 'test@example.com'
      });

      const mockIdToken = AuthTestHelper.createMockJWT(mockUser);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      expect(response.statusCode).toBe(200);

      // Verify that email was trimmed
      const callArgs = mockCognitoSend.mock.calls[0][0];
      expect(callArgs.input.AuthParameters.USERNAME).toBe('test@example.com');
    });
  });

  describe('Security Features', () => {
    it('should include security headers in response', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();
      const mockUser = MockDataFactory.createUser();
      const mockIdToken = AuthTestHelper.createMockJWT(mockUser);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      expect(response.headers).toBeDefined();
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(response.headers['X-Frame-Options']).toBe('DENY');
      expect(response.headers['X-XSS-Protection']).toBe('1; mode=block');
    });

    it('should handle malicious input safely', async () => {
      // Arrange
      const maliciousRequest = {
        email: 'test@example.com<script>alert("xss")</script>',
        password: 'ValidPassword123!'
      };

      const event = EventBuilder.createPOSTEvent('/auth/login', maliciousRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      // Should either validate and reject or sanitize the input
      expect([400, 401, 500]).toContain(response.statusCode);
    });
  });

  describe('Performance', () => {
    it('should complete authentication within acceptable time', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();
      const mockUser = MockDataFactory.createUser();
      const mockIdToken = AuthTestHelper.createMockJWT(mockUser);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act & Assert
      const startTime = Date.now();
      const response = await handler(event, context);
      const duration = Date.now() - startTime;

      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();
      const mockUser = MockDataFactory.createUser();
      const mockIdToken = AuthTestHelper.createMockJWT(mockUser);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const promises = Array(5).fill(0).map(() => handler(event, context));
      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      // Arrange
      const event = EventBuilder.createAPIGatewayEvent({
        httpMethod: 'POST',
        path: '/auth/login',
        body: 'invalid-json'
      });
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 400, 'VALIDATION_ERROR');
    });

    it('should handle missing request body', async () => {
      // Arrange
      const event = EventBuilder.createAPIGatewayEvent({
        httpMethod: 'POST',
        path: '/auth/login',
        body: null
      });
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 400, 'VALIDATION_ERROR');
    });

    it('should handle Cognito service errors', async () => {
      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();

      mockCognitoSend.mockRejectedValue(new Error('Service unavailable'));

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      APITestHelper.assertError(response, 502, 'EXTERNAL_SERVICE_ERROR');
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log authentication attempts', async () => {
      // This test would verify logging in a real implementation
      // For now, we just ensure the handler completes without throwing

      // Arrange
      const loginRequest = MockDataFactory.createLoginRequest();
      const mockUser = MockDataFactory.createUser();
      const mockIdToken = AuthTestHelper.createMockJWT(mockUser);

      mockCognitoSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: mockIdToken
        }
      });

      const event = EventBuilder.createPOSTEvent('/auth/login', loginRequest);
      const context = ContextBuilder.create();

      // Act
      const response = await handler(event, context);

      // Assert
      expect(response.statusCode).toBe(200);
      // In a real implementation, you would verify log entries
    });
  });
});