import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { ErrorBoundary } from '../components/shared';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

// Global error handler for the error boundary
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  // Log error details
  console.error('Global Error Boundary:', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    timestamp: new Date().toISOString(),
  });

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, Bugsnag, or your error tracking service
    // Sentry.captureException(error, {
    //   extra: { errorInfo, page: window.location.pathname }
    // });
  }
};

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handlers for unhandled promise rejections and errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Prevent the default browser behavior
      event.preventDefault();
    };

    const handleGlobalJSError = (event: ErrorEvent) => {
      console.error('Global JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    };

    // Add global error listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalJSError);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalJSError);
    };
  }, []);

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  );
}