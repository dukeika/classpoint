import { useCallback, useState } from 'react';

/**
 * Error state interface
 */
interface ErrorState {
  /** The error object if one exists */
  error: Error | null;
  /** Whether there's currently an error */
  hasError: boolean;
  /** Unique error ID for tracking */
  errorId: string | null;
  /** Timestamp when error occurred */
  timestamp: Date | null;
}

/**
 * Error handler options
 */
interface ErrorHandlerOptions {
  /** Custom error handler callback */
  onError?: (error: Error, errorId: string) => void;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Context name for error logging */
  context?: string;
}

/**
 * Return type for useErrorHandler hook
 */
interface UseErrorHandlerReturn {
  /** Current error state */
  errorState: ErrorState;
  /** Function to handle and set errors */
  handleError: (error: Error) => void;
  /** Function to clear current error */
  clearError: () => void;
  /** Function to retry that clears error and executes callback */
  retry: (callback?: () => void | Promise<void>) => Promise<void>;
  /** Convenience function to wrap async operations */
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R | undefined>;
}

/**
 * Custom hook for handling errors in React components
 * Provides error state management and utilities for error handling
 *
 * @param options - Configuration options for error handling
 * @returns Object with error state and handler functions
 *
 * @example
 * ```tsx
 * const { errorState, handleError, clearError, withErrorHandling } = useErrorHandler({
 *   context: 'UserDashboard',
 *   onError: (error, errorId) => logToService(error, errorId)
 * });
 *
 * const fetchUserData = withErrorHandling(async (userId: string) => {
 *   const response = await fetch(`/api/users/${userId}`);
 *   if (!response.ok) throw new Error('Failed to fetch user');
 *   return response.json();
 * });
 * ```
 */
export const useErrorHandler = (options: ErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const { onError, logErrors = true, context } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    errorId: null,
    timestamp: null,
  });

  /**
   * Generate a unique error ID
   */
  const generateErrorId = useCallback((): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Handle an error by updating state and calling handlers
   */
  const handleError = useCallback(
    (error: Error) => {
      const errorId = generateErrorId();
      const timestamp = new Date();

      // Update error state
      setErrorState({
        error,
        hasError: true,
        errorId,
        timestamp,
      });

      // Log error if enabled
      if (logErrors) {
        const contextPrefix = context ? `[${context}]` : '';
        console.group(`🚨 Error Handler ${contextPrefix}`);
        console.error('Error:', error.message);
        console.error('Error ID:', errorId);
        console.error('Timestamp:', timestamp.toISOString());
        console.error('Stack:', error.stack);
        console.groupEnd();
      }

      // Call custom error handler
      if (onError) {
        try {
          onError(error, errorId);
        } catch (handlerError) {
          console.error('Error in custom error handler:', handlerError);
        }
      }
    },
    [generateErrorId, logErrors, context, onError]
  );

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      errorId: null,
      timestamp: null,
    });
  }, []);

  /**
   * Retry function that clears error and optionally executes a callback
   */
  const retry = useCallback(
    async (callback?: () => void | Promise<void>) => {
      clearError();

      if (callback) {
        try {
          await callback();
        } catch (error) {
          if (error instanceof Error) {
            handleError(error);
          } else {
            handleError(new Error(String(error)));
          }
        }
      }
    },
    [clearError, handleError]
  );

  /**
   * Higher-order function that wraps async operations with error handling
   */
  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          clearError(); // Clear any previous errors
          const result = await fn(...args);
          return result;
        } catch (error) {
          if (error instanceof Error) {
            handleError(error);
          } else {
            handleError(new Error(String(error)));
          }
          return undefined;
        }
      };
    },
    [clearError, handleError]
  );

  return {
    errorState,
    handleError,
    clearError,
    retry,
    withErrorHandling,
  };
};

/**
 * Custom hook for handling API errors specifically
 * Extends useErrorHandler with API-specific error parsing
 */
export const useApiErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const baseHandler = useErrorHandler(options);

  /**
   * Parse API error response and extract meaningful error message
   */
  const parseApiError = useCallback((error: any): Error => {
    // Handle fetch API errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Error('Network error: Please check your internet connection');
    }

    // Handle Response object errors
    if (error instanceof Response) {
      return new Error(`API Error: ${error.status} ${error.statusText}`);
    }

    // Handle structured API errors
    if (error?.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    // Handle GraphQL errors
    if (error?.graphQLErrors?.length > 0) {
      return new Error(error.graphQLErrors[0].message);
    }

    // Handle AWS Amplify errors
    if (error?.errors?.length > 0) {
      return new Error(error.errors[0].message);
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return error;
    }

    // Fallback for unknown error types
    return new Error('An unexpected error occurred');
  }, []);

  /**
   * Handle API errors with proper parsing
   */
  const handleApiError = useCallback(
    (error: any) => {
      const parsedError = parseApiError(error);
      baseHandler.handleError(parsedError);
    },
    [parseApiError, baseHandler.handleError]
  );

  /**
   * Wrapper for API calls with automatic error handling
   */
  const withApiErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          baseHandler.clearError();
          const result = await fn(...args);
          return result;
        } catch (error) {
          handleApiError(error);
          return undefined;
        }
      };
    },
    [baseHandler.clearError, handleApiError]
  );

  return {
    ...baseHandler,
    handleApiError,
    withApiErrorHandling,
    parseApiError,
  };
};

export default useErrorHandler;