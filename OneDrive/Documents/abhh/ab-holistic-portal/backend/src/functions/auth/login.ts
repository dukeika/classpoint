import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
  AdminGetUserCommand,
  InitiateAuthCommandInput,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { validateRequest } from '../../utils/validation';
import { LoginRequest, AuthTokens, ApiResponse, UserRole } from '../../types';
import { JWTUtil } from '../../utils/jwt';
import { RateLimiter, RateLimitConfigs, InputSanitizer, SecurityHeaders, IPAccessControl } from '../../utils/security';
import { RateLimitError, ValidationError, AuthorizationError } from '../../utils/errors';

const logger = new Logger('AuthLogin');

// Initialize rate limiter for authentication with very strict limits
const authRateLimiter = new RateLimiter(RateLimitConfigs.AUTH_STRICT);

interface CognitoAuthResponse {
  AuthenticationResult?: {
    AccessToken: string;
    RefreshToken: string;
    IdToken: string;
    ExpiresIn: number;
    TokenType: string;
  };
  ChallengeName?: string;
  Session?: string;
  ChallengeParameters?: Record<string, string>;
}

/**
 * AWS Cognito Login Handler
 *
 * This function handles user authentication using AWS Cognito User Pools.
 * It supports both hosted UI redirects and direct authentication.
 *
 * Features:
 * - Direct authentication with email/password
 * - Support for Cognito hosted UI flow
 * - User role extraction from Cognito groups
 * - Comprehensive error handling
 * - Rate limiting protection
 */

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const clientIP = event.headers['X-Forwarded-For']?.split(',')[0] || event.requestContext.identity.sourceIp;
  const userAgent = event.headers['User-Agent'];

  logger.info('Login request received', {
    requestId: context.awsRequestId,
    sourceIp: clientIP,
    userAgent: userAgent
  });

  try {
    // SECURITY: Apply strict rate limiting for authentication attempts
    const rateLimitCheck = authRateLimiter.checkLimit(event);
    if (!rateLimitCheck.allowed) {
      logger.securityAudit(
        'login_rate_limit_exceeded',
        'auth_endpoint',
        'blocked',
        'high',
        clientIP,
        userAgent,
        { resetTime: rateLimitCheck.resetTime }
      );

      return createResponse(429, {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts. Please try again later.'
        },
        timestamp: new Date().toISOString()
      }, {
        ...SecurityHeaders.getSecurityHeaders(),
        'Retry-After': Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000).toString()
      });
    }

    // SECURITY: Check IP access control
    if (!IPAccessControl.isIPAllowed(clientIP || '')) {
      logger.securityAudit(
        'login_blocked_ip',
        'auth_endpoint',
        'blocked',
        'high',
        clientIP,
        userAgent
      );

      return createResponse(403, {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied from this location'
        },
        timestamp: new Date().toISOString()
      }, SecurityHeaders.getSecurityHeaders());
    }

    // SECURITY: Check for suspicious activity
    if (IPAccessControl.checkSuspiciousActivity(event)) {
      logger.securityAudit(
        'login_suspicious_activity',
        'auth_endpoint',
        'blocked',
        'high',
        clientIP,
        userAgent
      );

      return createResponse(403, {
        success: false,
        error: {
          code: 'SUSPICIOUS_ACTIVITY',
          message: 'Suspicious activity detected'
        },
        timestamp: new Date().toISOString()
      }, SecurityHeaders.getSecurityHeaders());
    }
    // SECURITY: Validate and sanitize request body
    const validationResult = validateRequest<LoginRequest>(event.body, {
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string', minLength: 8 },
      rememberMe: { required: false, type: 'boolean' }
    });

    if (!validationResult.isValid || !validationResult.data) {
      logger.securityAudit(
        'login_validation_failed',
        'auth_endpoint',
        'blocked',
        'medium',
        clientIP,
        userAgent,
        { errors: validationResult.errors }
      );

      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.errors
        },
        timestamp: new Date().toISOString()
      }, SecurityHeaders.getSecurityHeaders());
    }

    // SECURITY: Sanitize inputs to prevent injection attacks
    const sanitizedEmail = InputSanitizer.sanitizeEmail(validationResult.data.email);
    const sanitizedPassword = InputSanitizer.sanitizeString(validationResult.data.password);
    const { rememberMe = false } = validationResult.data;

    logger.info('Processing sanitized login request', {
      email: sanitizedEmail,
      rememberMe,
      hasPassword: !!sanitizedPassword
    });

    // Initialize Cognito client
    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.REGION || 'us-west-1'
    });

    const clientId = process.env.COGNITO_USER_POOL_WEB_CLIENT_ID;
    if (!clientId) {
      logger.error('COGNITO_USER_POOL_WEB_CLIENT_ID not configured');
      return createResponse(500, {
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Authentication service not configured'
        }
      });
    }

    // Attempt authentication with Cognito using sanitized inputs
    const authParams: InitiateAuthCommandInput = {
      ClientId: clientId,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: sanitizedEmail,
        PASSWORD: sanitizedPassword
      }
    };

    logger.info('Attempting Cognito authentication', {
      email: sanitizedEmail,
      rememberMe
    });

    const authCommand = new InitiateAuthCommand(authParams);
    const authResponse = await cognitoClient.send(authCommand);

    // Handle authentication challenges
    if (authResponse.ChallengeName) {
      logger.info('Authentication challenge required', {
        challengeName: authResponse.ChallengeName,
        email: sanitizedEmail
      });

      return createResponse(200, {
        success: false,
        data: {
          challengeName: authResponse.ChallengeName,
          session: authResponse.Session,
          challengeParameters: authResponse.ChallengeParameters
        },
        message: 'Authentication challenge required'
      });
    }

    // Check if authentication was successful
    if (!authResponse.AuthenticationResult) {
      logger.securityAudit('cognito_authentication_failed', 'auth_endpoint', 'failure',
        'medium',
        clientIP,
        userAgent,
        { email: sanitizedEmail }
      );

      return createResponse(401, {
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password'
        }
      }, SecurityHeaders.getSecurityHeaders());
    }

    const authResult = authResponse.AuthenticationResult;
    const accessToken = authResult.AccessToken!;

    // Get user details from Cognito
    const userDetails = await getUserDetails(cognitoClient, accessToken, sanitizedEmail);

    // Extract user role from Cognito groups
    const userRole = extractUserRole(userDetails.groups || []);

    // Prepare token response
    const tokens: AuthTokens = {
      accessToken: authResult.AccessToken!,
      refreshToken: authResult.RefreshToken!,
      idToken: authResult.IdToken!,
      expiresIn: authResult.ExpiresIn!,
      tokenType: 'Bearer' as const
    };

    // SECURITY: Log successful authentication
    logger.securityAudit(
      'login_successful',
      'auth_endpoint',
      'success',
      'low',
      clientIP,
      userAgent,
      {
        userId: userDetails.userId,
        email: userDetails.email,
        role: userRole,
        rememberMe
      }
    );

    const response: ApiResponse<{
      tokens: AuthTokens;
      user: {
        userId: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: UserRole;
        emailVerified: boolean;
      };
    }> = {
      success: true,
      data: {
        tokens,
        user: {
          userId: userDetails.userId,
          email: userDetails.email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          role: userRole,
          emailVerified: userDetails.emailVerified
        }
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    };

    return createResponse(200, response, SecurityHeaders.getSecurityHeaders());

  } catch (error) {
    // SECURITY: Log authentication errors with security context
    logger.securityAudit('login_error', 'auth_endpoint', 'failure',
      'high',
      clientIP,
      userAgent,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    );

    // Handle specific Cognito errors
    if (error && typeof error === 'object' && 'name' in error) {
      switch (error.name) {
        case 'NotAuthorizedException':
          return createResponse(401, {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password'
            }
          }, SecurityHeaders.getSecurityHeaders());

        case 'UserNotConfirmedException':
          return createResponse(401, {
            success: false,
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'Please verify your email address before logging in'
            }
          }, SecurityHeaders.getSecurityHeaders());

        case 'PasswordResetRequiredException':
          return createResponse(401, {
            success: false,
            error: {
              code: 'PASSWORD_RESET_REQUIRED',
              message: 'Password reset is required'
            }
          }, SecurityHeaders.getSecurityHeaders());

        case 'UserNotFoundException':
          return createResponse(401, {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password'
            }
          }, SecurityHeaders.getSecurityHeaders());

        case 'TooManyRequestsException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many login attempts. Please try again later.'
            }
          }, SecurityHeaders.getSecurityHeaders());

        default:
          logger.error('Unhandled Cognito error', { errorName: error.name });
      }
    }

    return createResponse(500, {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication service error'
      }
    }, SecurityHeaders.getSecurityHeaders());
  }
};

/**
 * Get user details from Cognito
 */
async function getUserDetails(
  cognitoClient: CognitoIdentityProviderClient,
  accessToken: string,
  email: string
): Promise<{
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  groups?: string[];
}> {
  try {
    // Get user using access token
    const getUserCommand = new GetUserCommand({
      AccessToken: accessToken
    });

    const userResponse = await cognitoClient.send(getUserCommand);

    const attributes = userResponse.UserAttributes || [];
    const attributeMap = new Map(
      attributes.map(attr => [attr.Name!, attr.Value!])
    );

    // Get user groups using admin API
    let groups: string[] = [];
    try {
      const adminGetUserCommand = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email
      });

      const adminUserResponse = await cognitoClient.send(adminGetUserCommand);
      groups = adminUserResponse.UserAttributes?.find(
        attr => attr.Name === 'cognito:groups'
      )?.Value?.split(',') || [];

    } catch (adminError) {
      logger.warn('Could not get user groups', {
        error: adminError instanceof Error ? adminError.message : 'Unknown error',
        email
      });
    }

    return {
      userId: userResponse.Username!,
      email: attributeMap.get('email') || email,
      firstName: attributeMap.get('given_name'),
      lastName: attributeMap.get('family_name'),
      emailVerified: attributeMap.get('email_verified') === 'true',
      groups
    };

  } catch (error) {
    logger.error('Failed to get user details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email
    });
    throw error;
  }
}

/**
 * Extract user role from Cognito groups
 */
function extractUserRole(groups: string[]): UserRole {
  if (!groups || groups.length === 0) {
    return UserRole.APPLICANT;
  }

  // Check for highest privilege first
  if (groups.some(group =>
    ['SuperAdmins', 'superadmin', 'super_admin'].includes(group)
  )) {
    return UserRole.SUPER_ADMIN;
  }

  if (groups.some(group =>
    ['Admins', 'admins', 'admin'].includes(group)
  )) {
    return UserRole.ADMIN;
  }

  return UserRole.APPLICANT;
}

export default handler;