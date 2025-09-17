/**
 * Enhanced Login Handler with all improvements applied
 *
 * This demonstrates the integration of:
 * - Centralized error handling
 * - Comprehensive logging
 * - Security enhancements
 * - Performance optimizations
 * - Strict TypeScript types
 */

import { APIGatewayProxyHandler, Context } from 'aws-lambda';
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../../utils/response';
import { validateSchema, applicantSchemas } from '../../utils/validation';
import { Logger, createRequestLogger } from '../../utils/logger';
import { ErrorHandler, AuthenticationError, ValidationError, ExternalServiceError } from '../../utils/errors';
import { SecurityMiddleware, InputSanitizer, RateLimitConfigs } from '../../utils/security';
import { PerformanceMonitor, MemoryManager } from '../../utils/performance';
import {
  LoginRequest,
  AuthenticatedUser,
  JWTPayload,
  UserRole,
  LambdaEvent,
  LambdaContext
} from '../../types';

// Security middleware configuration
const securityMiddleware = SecurityMiddleware.create({
  rateLimitConfig: RateLimitConfigs.AUTH_STRICT,
  allowedOrigins: process.env.CORS_ORIGIN?.split(',') || ['*'],
  validateIP: process.env.NODE_ENV === 'production',
  maxRequestSize: 1024, // 1KB for login requests
  allowedContentTypes: ['application/json'],
  requiredHeaders: ['Content-Type']
});

// Optimized Cognito client with connection pooling
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'us-west-1',
  maxAttempts: 3,
  requestTimeout: 30000,
  requestHandler: {
    httpOptions: {
      timeout: 30000,
      agent: {
        maxSockets: 10,
        keepAlive: true,
        keepAliveMsecs: 1000
      }
    }
  }
});

/**
 * Enhanced Login Handler
 */
export const handler: APIGatewayProxyHandler = async (
  event: LambdaEvent,
  context: LambdaContext
) => {
  const requestLogger = createRequestLogger()(event, context);
  requestLogger.logRequestStart(event.httpMethod, event.path);

  try {
    // Apply security middleware
    securityMiddleware.before(event, context);

    // Log memory usage at start
    MemoryManager.logMemoryUsage('request_start');

    // Performance monitoring wrapper
    const result = await PerformanceMonitor.monitor(
      'login_request',
      async () => {
        return await processLoginRequest(event, requestLogger);
      },
      2000 // 2 second threshold for login
    );

    // Log successful completion
    requestLogger.logRequestEnd(event.httpMethod, event.path, 200, {
      success: true,
      userId: result.data?.user.userId
    });

    // Log memory usage at end
    MemoryManager.logMemoryUsage('request_end');

    return result;

  } catch (error) {
    // Centralized error handling
    const errorResponse = ErrorHandler.handleError(
      error,
      context.awsRequestId,
      undefined, // userId not available in case of auth failure
      {
        path: event.path,
        method: event.httpMethod,
        userAgent: event.headers['User-Agent'],
        ip: event.headers['X-Forwarded-For']?.split(',')[0] || event.requestContext?.identity?.sourceIp
      }
    );

    // Log error completion
    requestLogger.logRequestEnd(event.httpMethod, event.path, errorResponse.statusCode, {
      success: false,
      error: true
    });

    return errorResponse;
  }
};

/**
 * Process login request with comprehensive validation and logging
 */
async function processLoginRequest(
  event: LambdaEvent,
  logger: Logger
): Promise<APIGatewayProxyResult> {

  // Parse and validate request body
  let requestBody: LoginRequest;
  try {
    const rawBody = event.body || '{}';
    const parsedBody = JSON.parse(rawBody);

    // Sanitize input data
    const sanitizedBody = InputSanitizer.sanitizeObject(parsedBody);

    // Validate against schema
    requestBody = validateSchema(applicantSchemas.login, sanitizedBody);

    logger.validation('login_request', true, undefined, {
      email: requestBody.email,
      hasPassword: !!requestBody.password
    });

  } catch (error) {
    logger.validation('login_request', false, error instanceof Error ? error.message : 'Unknown validation error');

    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError('Invalid request format', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Additional email validation and sanitization
  const sanitizedEmail = InputSanitizer.sanitizeEmail(requestBody.email);

  logger.authentication('login_attempt', false, undefined, {
    email: sanitizedEmail,
    timestamp: new Date().toISOString()
  });

  // Authenticate with Cognito
  const authResult = await authenticateWithCognito(
    sanitizedEmail,
    requestBody.password,
    logger
  );

  if (!authResult.AuthenticationResult) {
    logger.authentication('login_failed', false, undefined, {
      email: sanitizedEmail,
      reason: 'no_auth_result'
    });

    throw new AuthenticationError('Invalid email or password');
  }

  // Extract and validate tokens
  const { AccessToken, RefreshToken, IdToken } = authResult.AuthenticationResult;

  if (!IdToken) {
    logger.authentication('login_failed', false, undefined, {
      email: sanitizedEmail,
      reason: 'no_id_token'
    });

    throw new AuthenticationError('Authentication failed - no identity token');
  }

  // Parse and validate JWT payload
  const userData = await parseAndValidateJWT(IdToken, logger);

  // Create response data
  const authenticatedUser: AuthenticatedUser = {
    user: {
      userId: userData.sub,
      email: userData.email,
      firstName: userData.given_name || '',
      lastName: userData.family_name || '',
      role: userData.role || UserRole.APPLICANT,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: userData.email_verified || false
    },
    tokens: {
      accessToken: AccessToken!,
      refreshToken: RefreshToken!,
      idToken: IdToken,
      expiresIn: 3600, // 1 hour
      tokenType: 'Bearer' as const
    }
  };

  logger.authentication('login_success', true, userData.sub, {
    email: sanitizedEmail,
    role: userData.role,
    emailVerified: userData.email_verified
  });

  // Security audit log
  logger.securityAudit(
    'user_login',
    'authentication_system',
    'success',
    'low',
    event.headers['X-Forwarded-For']?.split(',')[0] || event.requestContext?.identity?.sourceIp,
    event.headers['User-Agent'],
    {
      userId: userData.sub,
      email: sanitizedEmail,
      role: userData.role
    }
  );

  return successResponse(
    authenticatedUser,
    'Login successful',
    200
  );
}

/**
 * Authenticate with Cognito with enhanced error handling
 */
async function authenticateWithCognito(
  email: string,
  password: string,
  logger: Logger
): Promise<{ AuthenticationResult?: { AccessToken?: string; RefreshToken?: string; IdToken?: string } }> {

  const startTime = Date.now();

  try {
    const authCommand = new InitiateAuthCommand({
      ClientId: process.env.USER_POOL_WEB_CLIENT_ID,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    logger.externalApi('cognito', '/InitiateAuth', 'POST', 0, 0, {
      email,
      flow: 'USER_PASSWORD_AUTH'
    });

    const response = await cognitoClient.send(authCommand);
    const duration = Date.now() - startTime;

    logger.externalApi('cognito', '/InitiateAuth', 'POST', 200, duration, {
      hasTokens: !!response.AuthenticationResult,
      challengeName: response.ChallengeName
    });

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log external API error
    logger.externalApi('cognito', '/InitiateAuth', 'POST', 500, duration, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Convert Cognito errors to our error types
    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAuthorizedException':
          throw new AuthenticationError('Invalid email or password');

        case 'UserNotConfirmedException':
          throw new AuthenticationError('Please verify your email address before logging in');

        case 'UserNotFoundException':
          throw new AuthenticationError('Invalid email or password'); // Don't reveal user doesn't exist

        case 'TooManyRequestsException':
          throw new ExternalServiceError('Cognito', 'Too many login attempts. Please try again later.');

        case 'InvalidParameterException':
          throw new ValidationError('Invalid login parameters');

        default:
          throw new ExternalServiceError('Cognito', `Authentication service error: ${error.message}`);
      }
    }

    throw new ExternalServiceError('Cognito', 'Unknown authentication error');
  }
}

/**
 * Parse and validate JWT token
 */
async function parseAndValidateJWT(idToken: string, logger: Logger): Promise<JWTPayload> {
  try {
    // Basic JWT parsing (in production, use a proper JWT library with signature verification)
    const [header, payload, signature] = idToken.split('.');

    if (!header || !payload || !signature) {
      throw new AuthenticationError('Invalid token format');
    }

    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64').toString()
    );

    // Validate required fields
    const requiredFields = ['sub', 'email', 'exp', 'iat'];
    const missingFields = requiredFields.filter(field => !decodedPayload[field]);

    if (missingFields.length > 0) {
      logger.validation('jwt_payload', false, `Missing required fields: ${missingFields.join(', ')}`);
      throw new AuthenticationError('Invalid token payload');
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp <= now) {
      logger.validation('jwt_payload', false, 'Token expired');
      throw new AuthenticationError('Token expired');
    }

    // Validate email format
    if (!InputSanitizer.sanitizeEmail(decodedPayload.email)) {
      logger.validation('jwt_payload', false, 'Invalid email format in token');
      throw new AuthenticationError('Invalid token data');
    }

    logger.validation('jwt_payload', true, undefined, {
      userId: decodedPayload.sub,
      email: decodedPayload.email,
      expiresAt: new Date(decodedPayload.exp * 1000).toISOString()
    });

    return {
      sub: decodedPayload.sub,
      email: decodedPayload.email,
      role: decodedPayload['cognito:groups']?.[0] || UserRole.APPLICANT,
      permissions: decodedPayload.permissions || [],
      iat: decodedPayload.iat,
      exp: decodedPayload.exp,
      iss: decodedPayload.iss,
      aud: decodedPayload.aud,
      given_name: decodedPayload.given_name,
      family_name: decodedPayload.family_name,
      email_verified: decodedPayload.email_verified
    } as JWTPayload & { given_name?: string; family_name?: string; email_verified?: boolean };

  } catch (error) {
    logger.error('JWT parsing failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      throw error;
    }

    throw new AuthenticationError('Token validation failed');
  }
}