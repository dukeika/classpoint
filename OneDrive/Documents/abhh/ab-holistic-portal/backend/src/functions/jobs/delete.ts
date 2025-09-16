import { APIGatewayProxyHandler } from 'aws-lambda'; 
import { successResponse, errorResponse } from '../../utils/response'; 
export const handler: APIGatewayProxyHandler = async (event) => { 
  try { return successResponse({ message: 'Delete job - TODO' }); } 
  catch (error) { return errorResponse({ code: 'ERROR', message: 'Failed' }, 500); } 
}; 
