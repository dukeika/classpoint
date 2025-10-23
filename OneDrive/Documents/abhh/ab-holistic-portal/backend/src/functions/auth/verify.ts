import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommandInput,
  ResendConfirmationCodeCommandInput
} from '@aws-sdk/client-cognito-identity-provider';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { validateRequest } from '../../utils/validation';
import { ApiResponse } from '../../types';

const logger = new Logger('AuthVerify');

interface VerifyEmailRequest {
  email: string;
  confirmationCode: string;
}

interface ResendCodeRequest {
  email: string;
}

/**
 * AWS Cognito Email Verification Handler
 *
 * This function handles email verification for user registration
 * using AWS Cognito User Pools.
 *
 * Features:
 * - Email confirmation with verification code
 * - Resend verification code functionality
 * - Comprehensive error handling
 * - Rate limiting protection
 */

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Verification request received', {
    requestId: context.awsRequestId,
    path: event.path,
    httpMethod: event.httpMethod,
    sourceIp: event.requestContext.identity.sourceIp
  });

  try {
    const httpMethod = event.httpMethod;

    // Route based on HTTP method
    if (httpMethod === 'POST') {
      return await handleEmailVerification(event, context);
    } else if (httpMethod === 'PUT') {
      return await handleResendCode(event, context);
    } else {
      return createResponse(405, {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed'
        }
      });
    }

  } catch (error) {
    logger.error('Verification handler error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'Verification service error'
      }
    });
  }
};

/**
 * Handle email verification with confirmation code
 */
async function handleEmailVerification(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    // Validate request body
    const validationResult = validateRequest<VerifyEmailRequest>(event.body, {
      email: { required: true, type: 'email' },
      confirmationCode: { required: true, type: 'string', minLength: 6, maxLength: 6 }
    });

    if (!validationResult.isValid || !validationResult.data) {
      logger.warn('Invalid verification request', {
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

    const { email, confirmationCode } = validationResult.data;

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

    // Confirm sign up with verification code
    const confirmParams: ConfirmSignUpCommandInput = {
      ClientId: clientId,
      Username: email,
      ConfirmationCode: confirmationCode
    };

    logger.info('Attempting email verification', { email });

    const confirmCommand = new ConfirmSignUpCommand(confirmParams);
    await cognitoClient.send(confirmCommand);

    logger.info('Email verification successful', { email });

    const response: ApiResponse<{ email: string; verified: boolean }> = {
      success: true,
      data: {
        email,
        verified: true
      },
      message: 'Email verified successfully. You can now log in.',
      timestamp: new Date().toISOString()
    };

    return createResponse(200, response);

  } catch (error) {
    logger.error('Email verification error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Handle specific Cognito errors
    if (error && typeof error === 'object' && 'name' in error) {
      switch (error.name) {
        case 'CodeMismatchException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'INVALID_CODE',
              message: 'Invalid verification code'
            }
          });

        case 'ExpiredCodeException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'EXPIRED_CODE',
              message: 'Verification code has expired. Please request a new one.'
            }
          });

        case 'UserNotFoundException':
          return createResponse(404, {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          });

        case 'NotAuthorizedException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'ALREADY_VERIFIED',
              message: 'User is already verified'
            }
          });

        case 'TooManyFailedAttemptsException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'TOO_MANY_ATTEMPTS',
              message: 'Too many failed verification attempts. Please request a new code.'
            }
          });

        case 'TooManyRequestsException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many requests. Please try again later.'
            }
          });

        default:
          logger.error('Unhandled Cognito error', { errorName: error.name });
      }
    }

    return createResponse(500, {
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'Email verification failed'
      }
    });
  }
}

/**
 * Handle resend verification code
 */
async function handleResendCode(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    // Validate request body
    const validationResult = validateRequest<ResendCodeRequest>(event.body, {
      email: { required: true, type: 'email' }
    });

    if (!validationResult.isValid || !validationResult.data) {
      logger.warn('Invalid resend code request', {
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

    const { email } = validationResult.data;

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

    // Resend confirmation code
    const resendParams: ResendConfirmationCodeCommandInput = {
      ClientId: clientId,
      Username: email
    };

    logger.info('Attempting to resend verification code', { email });

    const resendCommand = new ResendConfirmationCodeCommand(resendParams);
    const resendResponse = await cognitoClient.send(resendCommand);

    logger.info('Verification code resent successfully', {
      email,
      deliveryMedium: resendResponse.CodeDeliveryDetails?.DeliveryMedium
    });

    const response: ApiResponse<{
      email: string;
      deliveryMedium: string;
      destination: string;
    }> = {
      success: true,
      data: {
        email,
        deliveryMedium: resendResponse.CodeDeliveryDetails?.DeliveryMedium || 'EMAIL',
        destination: resendResponse.CodeDeliveryDetails?.Destination || email
      },
      message: 'Verification code sent successfully',
      timestamp: new Date().toISOString()
    };

    return createResponse(200, response);

  } catch (error) {
    logger.error('Resend code error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Handle specific Cognito errors
    if (error && typeof error === 'object' && 'name' in error) {
      switch (error.name) {
        case 'UserNotFoundException':
          return createResponse(404, {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          });

        case 'InvalidParameterException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'INVALID_PARAMETER',
              message: 'Invalid email address'
            }
          });

        case 'LimitExceededException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'LIMIT_EXCEEDED',
              message: 'Resend limit exceeded. Please try again later.'
            }
          });

        case 'TooManyRequestsException':
          return createResponse(429, {
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many requests. Please try again later.'
            }
          });

        case 'NotAuthorizedException':
          return createResponse(400, {
            success: false,
            error: {
              code: 'ALREADY_VERIFIED',
              message: 'User is already verified'
            }
          });

        default:
          logger.error('Unhandled Cognito error', { errorName: error.name });
      }
    }

    return createResponse(500, {
      success: false,
      error: {
        code: 'RESEND_ERROR',
        message: 'Failed to resend verification code'
      }
    });
  }
}

export default handler;