import { APIGatewayProxyResult } from 'aws-lambda';
import { SecurityHeaders } from './security';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Helper function to determine allowed origin
const getAllowedOrigin = (requestOrigin?: string): string => {
  const corsOrigins = process.env.CORS_ORIGINS || 'https://localhost:3000';
  const allowedOrigins = corsOrigins.split(',').map(origin => origin.trim());

  // If request origin is provided and is in allowed origins, use it
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Check for wildcard
  if (allowedOrigins.includes('*')) {
    return '*';
  }

  // Default to CloudFront origin for production
  const cloudFrontOrigin = 'https://d8wgee9e93vts.cloudfront.net';
  if (allowedOrigins.includes(cloudFrontOrigin)) {
    return cloudFrontOrigin;
  }

  // Fallback to first allowed origin
  return allowedOrigins[0] || 'https://localhost:3000';
};

export const createResponse = <T>(
  statusCode: number,
  body: Partial<ApiResponse<T>> & { success: boolean },
  additionalHeaders: Record<string, string> = {},
  includeSecurityHeaders: boolean = true,
  requestOrigin?: string
): APIGatewayProxyResult => {
  const allowOrigin = getAllowedOrigin(requestOrigin);

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };

  const securityHeaders = includeSecurityHeaders ? SecurityHeaders.getSecurityHeaders() : {};

  const defaultHeaders = {
    ...corsHeaders,
    ...securityHeaders,
    ...additionalHeaders,
  };

  // Ensure timestamp is always present
  const completeBody: ApiResponse<T> = {
    ...body,
    timestamp: body.timestamp || new Date().toISOString(),
  };

  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(completeBody),
  };
};

export const successResponse = <T>(
  data?: T,
  message?: string,
  statusCode: number = 200,
  requestOrigin?: string
): APIGatewayProxyResult => {
  const response: Partial<ApiResponse<T>> & { success: boolean } = {
    success: true,
    
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message !== undefined) {
    response.message = message;
  }

  return createResponse(statusCode, response, {}, true, requestOrigin);
};

export const errorResponse = (
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  },
  statusCode: number = 500,
  requestOrigin?: string
): APIGatewayProxyResult => {
  console.error('API Error:', error);

  return createResponse(statusCode, {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  }, {}, true, requestOrigin);
};

export const validationErrorResponse = (
  message: string,
  details?: Record<string, unknown>,
  requestOrigin?: string
): APIGatewayProxyResult => {
  const errorObj: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } = {
    code: 'VALIDATION_ERROR',
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return errorResponse(errorObj, 400, requestOrigin);
};

export const unauthorizedResponse = (
  message: string = 'Unauthorized',
  requestOrigin?: string
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'UNAUTHORIZED',
      message,
    },
    401,
    requestOrigin
  );
};

export const forbiddenResponse = (
  message: string = 'Forbidden',
  requestOrigin?: string
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'FORBIDDEN',
      message,
    },
    403,
    requestOrigin
  );
};

export const notFoundResponse = (
  resource: string = 'Resource',
  requestOrigin?: string
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    },
    404,
    requestOrigin
  );
};

export const conflictResponse = (
  message: string,
  requestOrigin?: string
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'CONFLICT',
      message,
    },
    409,
    requestOrigin
  );
};

export const internalServerErrorResponse = (
  message: string = 'Internal server error',
  details?: Record<string, unknown>,
  requestOrigin?: string
): APIGatewayProxyResult => {
  const errorObj: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } = {
    code: 'INTERNAL_SERVER_ERROR',
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return errorResponse(errorObj, 500, requestOrigin);
};

// CORS preflight response handler
export const corsPreflightResponse = (requestOrigin?: string): APIGatewayProxyResult => {
  const allowOrigin = getAllowedOrigin(requestOrigin);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    },
    body: ''
  };
};