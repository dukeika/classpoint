import React, { ReactNode, useCallback, useMemo, ErrorInfo } from 'react';
import ErrorBoundary from './ErrorBoundary';
import Button from './Button';
import Card from './Card';

/**
 * Props for AsyncErrorBoundary component
 */
interface AsyncErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional error boundary name for debugging */
  name?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom fallback component */
  fallback?: (props: AsyncErrorFallbackProps) => ReactNode;
}

/**
 * Props passed to fallback component
 */
interface AsyncErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  name?: string;
}

/**
 * Default fallback component for async errors
 */
const DefaultAsyncErrorFallback: React.FC<AsyncErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  name,
}) => {
  const errorId = useMemo(
    () => `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const isNetworkError = useMemo(() => {
    return (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  }, [error]);

  const isTimeoutError = useMemo(() => {
    return (
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('aborted')
    );
  }, [error]);

  const getErrorTitle = () => {
    if (isNetworkError) return 'Connection Problem';
    if (isTimeoutError) return 'Request Timeout';
    return 'Something went wrong';
  };

  const getErrorMessage = () => {
    if (isNetworkError) {
      return 'Please check your internet connection and try again.';
    }
    if (isTimeoutError) {
      return 'The request took too long to complete. Please try again.';
    }
    return 'We encountered an unexpected error. This has been logged and our team will investigate.';
  };

  const getErrorIcon = () => {
    if (isNetworkError) {
      return (
        <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 6v6m0 0v6" />
        </svg>
      );
    }
    if (isTimeoutError) {
      return (
        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  const getBorderColor = () => {
    if (isNetworkError) return 'border-orange-200 bg-orange-50';
    if (isTimeoutError) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  return (
    <Card className={`max-w-2xl mx-auto my-8 ${getBorderColor()}`}>
      <div className="p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-white mb-4">
          {getErrorIcon()}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {getErrorTitle()}{name ? ` in ${name}` : ''}
        </h2>

        <p className="text-gray-700 mb-4">
          {getErrorMessage()}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4 p-4 bg-gray-100 rounded border">
            <summary className="cursor-pointer font-medium text-gray-800 mb-2">
              Error Details (Development)
            </summary>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              <div>
                <strong>Type:</strong> {error.name}
              </div>
              <div>
                <strong>Error ID:</strong> {errorId}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-xs bg-gray-200 p-2 rounded overflow-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex justify-center space-x-3">
          <Button
            onClick={resetErrorBoundary}
            variant="primary"
            size="sm"
          >
            Try Again
          </Button>
          <Button
            onClick={handleReload}
            variant="outline"
            size="sm"
          >
            Reload Page
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Error ID: {errorId}
        </p>
      </div>
    </Card>
  );
};

/**
 * Enhanced error boundary for async operations and API calls.
 * Uses react-error-boundary library for better async error handling.
 *
 * @example
 * ```tsx
 * <AsyncErrorBoundary name="UserAPI" onError={logAsyncError}>
 *   <UserDataComponent />
 * </AsyncErrorBoundary>
 * ```
 */
const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  onError,
  name,
  showRetry = true,
  fallback,
}) => {
  const handleError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      // Log error details
      const errorDetails = {
        name: name || 'AsyncErrorBoundary',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      console.group(`🚨 Async Error Boundary Caught Error [${name || 'Unknown'}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Details:', errorDetails);
      console.groupEnd();

      // Call custom error handler if provided
      if (onError) {
        try {
          onError(error, errorInfo);
        } catch (handlerError) {
          console.error('Error in async error handler:', handlerError);
        }
      }

      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: sendAsyncErrorToService(errorDetails);
      }
    },
    [onError, name]
  );

  // Removed unused fallbackComponent function

  return (
    <ErrorBoundary
      name={name}
      onError={handleError}
      showRetry={showRetry}
      fallback={fallback ? (error, errorInfo, retry) => fallback({ error, resetErrorBoundary: retry, name }) : undefined}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AsyncErrorBoundary;
export { DefaultAsyncErrorFallback };
export type { AsyncErrorBoundaryProps, AsyncErrorFallbackProps };