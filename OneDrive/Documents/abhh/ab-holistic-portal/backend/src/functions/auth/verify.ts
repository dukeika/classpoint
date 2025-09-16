import { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse, errorResponse } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Implement email verification
    return successResponse({ message: 'Verify endpoint - TODO' });
  } catch (error) {
    console.error('Verify error:', error);
    return errorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Verification failed',
    }, 500);
  }
};