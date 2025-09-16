import { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse, errorResponse } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const jobId = event.pathParameters?.id;
    return successResponse({ jobId, message: 'Get job endpoint - TODO' });
  } catch (error) {
    console.error('Get job error:', error);
    return errorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get job',
    }, 500);
  }
};