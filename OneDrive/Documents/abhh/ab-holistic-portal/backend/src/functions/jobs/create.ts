import { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse, errorResponse } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Implement job creation
    return successResponse({ message: 'Create job endpoint - TODO' });
  } catch (error) {
    console.error('Create job error:', error);
    return errorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Job creation failed',
    }, 500);
  }
};