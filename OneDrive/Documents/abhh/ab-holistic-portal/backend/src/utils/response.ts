import { APIGatewayProxyResult } from 'aws-lambda';

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
}

export const createResponse = <T>(
  statusCode: number,
  body: ApiResponse<T>,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers,
  };

  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(body),
  };
};

export const successResponse = <T>(
  data?: T,
  message?: string,
  statusCode: number = 200
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message !== undefined) {
    response.message = message;
  }

  return createResponse(statusCode, response);
};

export const errorResponse = (
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  },
  statusCode: number = 500
): APIGatewayProxyResult => {
  console.error('API Error:', error);

  return createResponse(statusCode, {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  });
};

export const validationErrorResponse = (
  message: string,
  details?: Record<string, unknown>
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

  return errorResponse(errorObj, 400);
};

export const unauthorizedResponse = (
  message: string = 'Unauthorized'
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'UNAUTHORIZED',
      message,
    },
    401
  );
};

export const forbiddenResponse = (
  message: string = 'Forbidden'
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'FORBIDDEN',
      message,
    },
    403
  );
};

export const notFoundResponse = (
  resource: string = 'Resource'
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    },
    404
  );
};

export const conflictResponse = (
  message: string
): APIGatewayProxyResult => {
  return errorResponse(
    {
      code: 'CONFLICT',
      message,
    },
    409
  );
};

export const internalServerErrorResponse = (
  message: string = 'Internal server error',
  details?: Record<string, unknown>
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

  return errorResponse(errorObj, 500);
};