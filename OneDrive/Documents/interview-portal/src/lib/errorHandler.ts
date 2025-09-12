// File: src/lib/errorHandler.ts
import { GraphQLError } from 'graphql';

export interface AppError {
  message: string;
  code: string;
  type: 'VALIDATION' | 'AUTHORIZATION' | 'NOT_FOUND' | 'NETWORK' | 'SERVER' | 'UNKNOWN';
  details?: any;
}

export class ErrorHandler {
  static handleGraphQLError(error: any): AppError {
    console.error('GraphQL Error:', error);

    // Handle GraphQL errors
    if (error.errors) {
      const graphQLError = error.errors[0] as GraphQLError;
      
      if (graphQLError.message.includes('Unauthorized')) {
        return {
          message: 'You are not authorized to perform this action',
          code: 'UNAUTHORIZED',
          type: 'AUTHORIZATION',
        };
      }

      if (graphQLError.message.includes('not found')) {
        return {
          message: 'The requested resource was not found',
          code: 'NOT_FOUND',
          type: 'NOT_FOUND',
        };
      }

      if (graphQLError.message.includes('validation')) {
        return {
          message: 'Invalid input data provided',
          code: 'VALIDATION_ERROR',
          type: 'VALIDATION',
          details: graphQLError.message,
        };
      }

      return {
        message: graphQLError.message,
        code: 'GRAPHQL_ERROR',
        type: 'SERVER',
        details: graphQLError,
      };
    }

    // Handle network errors
    if (error.networkError) {
      return {
        message: 'Network error occurred. Please check your connection.',
        code: 'NETWORK_ERROR',
        type: 'NETWORK',
        details: error.networkError,
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'GENERIC_ERROR',
        type: 'UNKNOWN',
        details: error,
      };
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      type: 'UNKNOWN',
      details: error,
    };
  }

  static handleValidationError(error: any): AppError {
    return {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      type: 'VALIDATION',
      details: error.errors || error,
    };
  }

  static createCustomError(
    message: string,
    code: string,
    type: AppError['type'],
    details?: any
  ): AppError {
    return {
      message,
      code,
      type,
      details,
    };
  }
}

// Hook for consistent error handling in components
export function useErrorHandler() {
  const handleError = (error: any): AppError => {
    const appError = ErrorHandler.handleGraphQLError(error);
    
    // You can add custom error reporting here (e.g., send to monitoring service)
    console.error('App Error:', appError);
    
    return appError;
  };

  const showUserFriendlyMessage = (error: AppError): string => {
    switch (error.type) {
      case 'AUTHORIZATION':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested item could not be found.';
      case 'VALIDATION':
        return 'Please check your input and try again.';
      case 'NETWORK':
        return 'Connection error. Please check your internet connection.';
      case 'SERVER':
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return {
    handleError,
    showUserFriendlyMessage,
  };
}