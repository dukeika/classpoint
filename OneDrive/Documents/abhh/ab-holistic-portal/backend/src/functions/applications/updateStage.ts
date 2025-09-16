import { APIGatewayProxyHandler } from 'aws-lambda'; 
import { successResponse } from '../../utils/response'; 
export const handler: APIGatewayProxyHandler = async (event) => successResponse({ message: 'Update stage - TODO' }); 
