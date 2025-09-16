import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response';
import { validateSchema, applicantSchemas } from '../../utils/validation';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'us-west-1'
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate input
    const validatedData = validateSchema(applicantSchemas.login, body);
    const { email, password } = validatedData;

    // Initiate authentication with Cognito
    const authCommand = new InitiateAuthCommand({
      ClientId: process.env.USER_POOL_WEB_CLIENT_ID,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const authResult = await cognitoClient.send(authCommand);

    if (!authResult.AuthenticationResult) {
      return errorResponse(
        {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
        },
        401
      );
    }

    const { AccessToken, RefreshToken, IdToken } = authResult.AuthenticationResult;

    // Decode the ID token to get user information
    const idTokenPayload = JSON.parse(
      Buffer.from(IdToken!.split('.')[1], 'base64').toString()
    );

    const userData = {
      userId: idTokenPayload.sub,
      email: idTokenPayload.email,
      firstName: idTokenPayload.given_name,
      lastName: idTokenPayload.family_name,
      role: idTokenPayload['cognito:groups']?.[0] || 'applicant',
      emailVerified: idTokenPayload.email_verified,
    };

    return successResponse({
      user: userData,
      tokens: {
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        idToken: IdToken,
      },
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof Error) {
      // Handle Cognito-specific errors
      if (error.name === 'NotAuthorizedException') {
        return errorResponse(
          {
            code: 'AUTHENTICATION_FAILED',
            message: 'Invalid email or password',
          },
          401
        );
      }

      if (error.name === 'UserNotConfirmedException') {
        return errorResponse(
          {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address before logging in',
          },
          401
        );
      }

      if (error.name === 'UserNotFoundException') {
        return errorResponse(
          {
            code: 'USER_NOT_FOUND',
            message: 'User account not found',
          },
          404
        );
      }

      if (error.name === 'ValidationError') {
        return validationErrorResponse(error.message, (error as any).details);
      }
    }

    return errorResponse(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during login',
      },
      500
    );
  }
};