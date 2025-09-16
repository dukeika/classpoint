import { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse, errorResponse } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Implement job listing
    return successResponse({ jobs: [], message: 'List jobs endpoint - TODO' });
  } catch (error) {
    console.error('List jobs error:', error);
    return errorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to list jobs',
    }, 500);
  }
};