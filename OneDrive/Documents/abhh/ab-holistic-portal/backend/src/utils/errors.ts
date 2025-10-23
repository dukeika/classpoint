/**
 * Centralized Error Handling System for AB Holistic Interview Portal
 *
 * This module provides a comprehensive error handling system with:
 * - Custom error classes for different error types
 * - Standardized error codes and messages
 * - Error classification and severity levels
 * - Proper error serialization for API responses
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from './response';
import { Logger } from './logger';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for better classification
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  RATE_LIMIT = 'rate_limit',
  SYSTEM = 'system'
}

// Base error interface
export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Base Application Error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    statusCode: number,
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.userId = userId;
    this.metadata = metadata;

    // Maintain proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      metadata: this.metadata
    };
  }

  /**
   * Get sanitized error details for client response
   * Removes sensitive information in production
   */
  toClientError(): { code: string; message: string; details?: Record<string, unknown> } {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      code: this.code,
      message: this.message,
      ...(isProduction ? {} : { details: this.details })
    };
  }
}

/**
 * Validation Error - for input validation failures
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      400,
      details,
      requestId,
      userId
    );
  }
}

/**
 * Authentication Error - for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      401,
      details,
      requestId,
      userId
    );
  }
}

/**
 * Authorization Error - for authorization failures
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access forbidden',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      403,
      details,
      requestId,
      userId
    );
  }
}

/**
 * Not Found Error - for resource not found
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      `${resource} not found`,
      'NOT_FOUND_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      404,
      details,
      requestId,
      userId
    );
  }
}

/**
 * Conflict Error - for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'CONFLICT_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      409,
      details,
      requestId,
      userId
    );
  }
}

/**
 * Rate Limit Error - for rate limiting
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      429,
      details,
      requestId,
      userId
    );
  }
}

/**
 * Database Error - for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      500,
      details,
      requestId,
      userId
    );
  }
}

/**
 * External Service Error - for third-party service failures
 */
export class ExternalServiceError extends AppError {
  constructor(
    serviceName: string,
    message: string = 'External service error',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      `${serviceName}: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      502,
      { serviceName, ...details },
      requestId,
      userId
    );
  }
}

/**
 * Business Logic Error - for business rule violations
 */
export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      422,
      details,
      requestId,
      userId
    );
  }
}

/**
 * System Error - for internal system errors
 */
export class SystemError extends AppError {
  constructor(
    message: string = 'Internal system error',
    details?: Record<string, unknown>,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      message,
      'SYSTEM_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      500,
      details,
      requestId,
      userId,
      metadata
    );
  }
}

/**
 * Error Handler Class
 * Central error processing and response generation
 */
export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  /**
   * Handle and format errors for API responses
   */
  static handleError(
    error: unknown,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, unknown>,
    requestOrigin?: string
  ): APIGatewayProxyResult {
    let appError: AppError;

    // Convert unknown errors to AppError instances
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.convertKnownError(error, requestId, userId, metadata);
    } else {
      appError = new SystemError(
        'Unknown error occurred',
        { originalError: error },
        requestId,
        userId,
        metadata
      );
    }

    // Log the error with appropriate level
    this.logError(appError);

    // Return formatted API response with CORS headers
    return createResponse(appError.statusCode, {
      success: false,
      error: appError.toClientError(),
      timestamp: appError.timestamp,
      requestId: appError.requestId
    }, {}, true, requestOrigin);
  }

  /**
   * Convert known error types to AppError instances
   */
  private static convertKnownError(
    error: Error,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): AppError {
    // Handle Cognito errors
    if (error.name === 'NotAuthorizedException') {
      return new AuthenticationError('Invalid credentials', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'UserNotConfirmedException') {
      return new AuthenticationError('User email not verified', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'UserNotFoundException') {
      return new NotFoundError('User', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'TooManyRequestsException') {
      return new RateLimitError('Too many requests', { originalError: error.message }, requestId, userId);
    }

    // Handle DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      return new NotFoundError('Resource', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'ConditionalCheckFailedException') {
      return new ConflictError('Resource conflict', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'ProvisionedThroughputExceededException') {
      return new RateLimitError('Database throughput exceeded', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'ValidationException') {
      return new ValidationError('Invalid request data', { originalError: error.message }, requestId, userId);
    }

    // Handle S3 errors
    if (error.name === 'NoSuchBucket' || error.name === 'NoSuchKey') {
      return new NotFoundError('File', { originalError: error.message }, requestId, userId);
    }

    if (error.name === 'AccessDenied') {
      return new AuthorizationError('Access denied', { originalError: error.message }, requestId, userId);
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return new ValidationError('Invalid JSON format', { originalError: error.message }, requestId, userId);
    }

    // Default to system error
    return new SystemError(
      error.message || 'Unknown system error',
      { originalError: error.message, stack: error.stack },
      requestId,
      userId,
      metadata
    );
  }

  /**
   * Log error with appropriate level based on severity
   */
  private static logError(error: AppError): void {
    const logData = {
      error: error.toJSON(),
      stack: error.stack
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        this.logger.info('Low severity error', logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn('Medium severity error', logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error('High severity error', logData);
        break;
      case ErrorSeverity.CRITICAL:
        this.logger.error('Critical error', logData);
        // TODO: Add alerting for critical errors
        break;
      default:
        this.logger.error('Unknown severity error', logData);
    }
  }

  /**
   * Wrap async functions with error handling
   */
  static wrapAsync<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logger.error(`Error in ${context || 'async function'}:`, { error });
        throw error;
      }
    };
  }

  /**
   * Validate required environment variables
   */
  static validateEnvironment(requiredVars: string[]): void {
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new SystemError(
        'Missing required environment variables',
        { missingVariables: missing }
      );
    }
  }
}

/**
 * Error decorator for Lambda handlers
 */
export function withErrorHandling(requestId?: string, userId?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        return ErrorHandler.handleError(error, requestId, userId);
      }
    };

    return descriptor;
  };
}

// Export all error types for easy importing
export {
  ValidationError as ValidationErr,
  AuthenticationError as AuthErr,
  AuthorizationError as AuthzErr,
  NotFoundError as NotFoundErr,
  ConflictError as ConflictErr,
  RateLimitError as RateLimitErr,
  DatabaseError as DatabaseErr,
  ExternalServiceError as ExternalServiceErr,
  BusinessLogicError as BusinessLogicErr,
  SystemError as SystemErr
};