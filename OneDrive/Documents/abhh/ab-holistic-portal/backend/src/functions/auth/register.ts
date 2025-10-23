import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  SignUpCommandInput
} from '@aws-sdk/client-cognito-identity-provider';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { validateRequest } from '../../utils/validation';
import { RegisterRequest, ApiResponse, UserRole } from '../../types';

const logger = new Logger('AuthRegister');

/**
 * AWS Cognito Registration Handler
 *
 * This function handles user registration using AWS Cognito User Pools.
 * It supports automatic group assignment based on email domains and
 * comprehensive validation.
 *
 * Features:
 * - User registration with email verification
 * - Automatic role assignment
 * - Email domain-based admin assignment
 * - Comprehensive input validation
 * - Error handling for various registration scenarios
 */

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Registration request received', {
    requestId: context.awsRequestId,
    sourceIp: event.requestContext.identity.sourceIp,
    userAgent: event.headers['User-Agent']
  });

  try {
    // Validate request body
    const validationResult = validateRequest<RegisterRequest>(event.body, {
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string', minLength: 8 },
      firstName: { required: true, type: 'string', minLength: 1, maxLength: 50 },
      lastName: { required: true, type: 'string', minLength: 1, maxLength: 50 },
      phone: { required: false, type: 'string' }
    });

    if (!validationResult.isValid || !validationResult.data) {
      logger.warn('Invalid registration request', {
        errors: validationResult.errors
      });
      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.errors
        }
      });
    }

    const { email, password, firstName, lastName, phone } = validationResult.data;

    // Additional password validation
    if (!isValidPassword(password)) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
        }
      });
    }

    // Initialize Cognito client
    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.REGION || 'us-west-1'
    });

    const clientId = process.env.COGNITO_USER_POOL_WEB_CLIENT_ID;
    const userPoolId = process.env.COGNITO_USER_POOL_ID;

    if (!clientId || !userPoolId) {
      logger.error('Cognito configuration missing', {
        hasClientId: !!clientId,
        hasUserPoolId: !!userPoolId
      });
      return createResponse(500, {
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Authentication service not configured'
        }
      });
    }

    // Determine user role based on email domain
    const userRole = determineUserRole(email);

    // Prepare user attributes
    const userAttributes = [
      { Name: 'email', Value: email },
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
      { Name: 'email_verified', Value: 'false' }
    ];

    if (phone) {
      userAttributes.push({ Name: 'phone_number', Value: phone });
    }

    // Register user with Cognito
    const signUpParams: SignUpCommandInput = {
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: userAttributes
    };

    logger.info('Attempting user registration', {
      email,
      role: userRole,
      hasPhone: !!phone
    });

    const signUpCommand = new SignUpCommand(signUpParams);
    const signUpResponse = await cognitoClient.send(signUpCommand);

    // Add user to appropriate group if admin
    if (userRole !== UserRole.APPLICANT) {
      try {
        const groupName = userRole === UserRole.SUPER_ADMIN ? 'SuperAdmins' : 'Admins';

        const addToGroupCommand = new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: email,
          GroupName: groupName
        });

        await cognitoClient.send(addToGroupCommand);

        logger.info('User added to group', {
          email,
          groupName,
          role: userRole
        });

      } catch (groupError) {
        logger.warn('Failed to add user to group', {
          error: groupError instanceof Error ? groupError.message : 'Unknown error',
          email,
          role: userRole
        });
        // Continue with registration even if group assignment fails
      }
    }

    logger.info('Registration successful', {
      userId: signUpResponse.UserSub,
      email,
      role: userRole,
      verificationRequired: !signUpResponse.UserConfirmed
    });

    const response: ApiResponse<{
      userId: string;
      email: string;
      role: UserRole;
      emailVerificationRequired: boolean;
      message: string;
    }> = {
      success: true,
      data: {
        userId: signUpResponse.UserSub!,
        email,
        role: userRole,
        emailVerificationRequired: !signUpResponse.UserConfirmed,
        message: signUpResponse.UserConfirmed
          ? 'Registration successful. You can now log in.'
          : 'Registration successful. Please check your email for verification instructions.'
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    };

    return createResponse(201, response);

  } catch (error) {
    logger.error('Registration error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle specific Cognito errors
    if (error && typeof error === 'object' && 'name' in error) {
      switch (error.name) {
        case 'UsernameExistsException':
          return createResponse(409, {
            success: false,
            error: {
              code: 'USER_EXISTS',
              message: 'An account with this email address already exists'
            }
          });

        case 'InvalidPasswordException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'INVALID_PASSWORD',
              message: 'Password does not meet requirements'
            }
          });

        case 'InvalidParameterException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'INVALID_PARAMETER',
              message: 'Invalid registration parameters'
            }
          });

        case 'TooManyRequestsException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many registration attempts. Please try again later.'
            }
          });

        case 'LimitExceededException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'LIMIT_EXCEEDED',
              message: 'Registration limit exceeded. Please contact support.'
            }
          });

        default:
          logger.error('Unhandled Cognito error', { errorName: error.name });
      }
    }

    return createResponse(500, {
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Registration service error'
      }
    });
  }
};

/**
 * Validate password strength
 */
function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Determine user role based on email domain
 */
function determineUserRole(email: string): UserRole {
  const adminDomains = [
    'abholisticportal.com',
    'abhh.com',
    'admin.com' // Add your admin domains here
  ];

  const superAdminEmails = [
    'admin@abholisticportal.com',
    'superadmin@abholisticportal.com'
    // Add specific super admin emails here
  ];

  // Check for super admin emails first
  if (superAdminEmails.includes(email.toLowerCase())) {
    return UserRole.SUPER_ADMIN;
  }

  // Check for admin domains
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (emailDomain && adminDomains.includes(emailDomain)) {
    return UserRole.ADMIN;
  }

  // Default to applicant
  return UserRole.APPLICANT;
}

export default handler;