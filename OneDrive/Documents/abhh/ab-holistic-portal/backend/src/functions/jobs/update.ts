import { APIGatewayProxyHandler } from 'aws-lambda';
import { successResponse, errorResponse } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const jobId = event.pathParameters?.id;
    return successResponse({ jobId, message: 'Update job endpoint - TODO' });
  } catch (error) {
    return errorResponse({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update job' }, 500);
  }
};