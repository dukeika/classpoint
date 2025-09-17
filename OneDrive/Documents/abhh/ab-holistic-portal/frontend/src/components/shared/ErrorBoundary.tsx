import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import Card from './Card';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback component to render on error */
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional error boundary name for debugging */
  name?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application.
 *
 * @example
 * ```tsx
 * <ErrorBoundary name="UserDashboard" onError={logError}>
 *   <UserDashboard />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  /**
   * Static method called when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  /**
   * Called after an error has been thrown by a descendant component
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error details
    const errorDetails = {
      name: name || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.group(`🚨 Error Boundary Caught Error [${name || 'Unknown'}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    console.groupEnd();

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(errorDetails);
    }
  }

  /**
   * Retry handler to reset error boundary state
   */
  handleRetry = () => {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }

    // Reset state after a brief delay to ensure clean re-render
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    }, 100);
  };

  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Default fallback UI when no custom fallback is provided
   */
  private renderDefaultFallback = () => {
    const { error, errorInfo, errorId } = this.state;
    const { showRetry = true, name } = this.props;

    return (
      <Card className="max-w-2xl mx-auto my-8 border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Something went wrong{name ? ` in ${name}` : ''}
          </h2>

          <p className="text-red-700 mb-4">
            We encountered an unexpected error. This has been logged and our team will investigate.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left mb-4 p-4 bg-red-100 rounded border">
              <summary className="cursor-pointer font-medium text-red-800 mb-2">
                Error Details (Development)
              </summary>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                <div>
                  <strong>Error ID:</strong> {errorId}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs bg-red-200 p-2 rounded overflow-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs bg-red-200 p-2 rounded overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex justify-center space-x-3">
            {showRetry && (
              <Button
                onClick={this.handleRetry}
                variant="primary"
                size="sm"
              >
                Try Again
              </Button>
            )}
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>

          <p className="text-xs text-red-600 mt-4">
            Error ID: {errorId}
          </p>
        </div>
      </Card>
    );
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Render custom fallback if provided, otherwise render default
      if (fallback && errorInfo) {
        try {
          return fallback(error, errorInfo, this.handleRetry);
        } catch (fallbackError) {
          console.error('Error in fallback component:', fallbackError);
          return this.renderDefaultFallback();
        }
      }

      return this.renderDefaultFallback();
    }

    return children;
  }
}

export default ErrorBoundary;