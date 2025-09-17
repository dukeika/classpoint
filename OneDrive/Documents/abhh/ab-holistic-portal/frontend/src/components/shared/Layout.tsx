import React, { useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';
import AsyncErrorBoundary from './AsyncErrorBoundary';

/**
 * Layout component props with enhanced type safety
 */
export interface LayoutProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Maximum content width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
  /** Whether to add padding to content */
  padding?: boolean;
  /** Current user information */
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'applicant' | 'superadmin';
    avatar?: string;
  } | null;
  /** Logout handler */
  onLogout?: () => void;
  /** Sidebar content */
  sidebar?: React.ReactNode;
  /** Whether to show footer */
  footer?: boolean;
  /** Error boundary configuration */
  errorBoundary?: {
    /** Whether to enable error boundary */
    enabled?: boolean;
    /** Custom error fallback */
    fallback?: (error: Error, errorInfo: any, retry: () => void) => React.ReactNode;
    /** Error handler callback */
    onError?: (error: Error, errorInfo: any) => void;
    /** Error boundary name for debugging */
    name?: string;
  };
  /** Whether content should be in async error boundary */
  asyncErrorBoundary?: boolean;
  /** Loading state for the entire layout */
  loading?: boolean;
  /** Layout variant */
  variant?: 'default' | 'minimal' | 'dashboard';
}

/**
 * Enhanced Layout component with error boundaries and performance optimizations
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  maxWidth = '7xl',
  padding = true,
  user,
  onLogout,
  sidebar,
  footer = true,
  errorBoundary = { enabled: true },
  asyncErrorBoundary = false,
  loading = false,
  variant = 'default',
}) => {
  /**
   * Memoized max width classes for performance
   */
  const maxWidthClasses = useMemo(() => ({
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }), []);

  /**
   * Memoized layout classes based on variant
   */
  const layoutClasses = useMemo(() => {
    const baseClasses = 'min-h-screen flex flex-col';
    const variantClasses = {
      default: 'bg-gray-50',
      minimal: 'bg-white',
      dashboard: 'bg-gray-100',
    };
    return `${baseClasses} ${variantClasses[variant]}`;
  }, [variant]);

  /**
   * Error handler for layout errors
   */
  const handleLayoutError = useCallback((error: Error, errorInfo: any) => {
    console.error('Layout Error:', error);
    console.error('Error Info:', errorInfo);

    // Call custom error handler if provided
    if (errorBoundary.onError) {
      errorBoundary.onError(error, errorInfo);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService({ error, errorInfo, context: 'Layout' });
    }
  }, [errorBoundary.onError]);

  /**
   * Render loading overlay
   */
  const renderLoadingOverlay = () => {
    if (!loading) return null;

    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 text-lg">Loading...</span>
        </div>
      </div>
    );
  };

  /**
   * Render main content with optional error boundaries
   */
  const renderContent = () => {
    const contentElement = (
      <div
        className={clsx(
          'flex-1',
          maxWidthClasses[maxWidth],
          padding && 'px-4 sm:px-6 lg:px-8 py-8',
          !sidebar && 'mx-auto',
          className
        )}
      >
        {children}
      </div>
    );

    // Wrap in async error boundary if enabled
    if (asyncErrorBoundary) {
      return (
        <AsyncErrorBoundary
          name={errorBoundary.name || 'LayoutContent'}
          onError={handleLayoutError}
        >
          {contentElement}
        </AsyncErrorBoundary>
      );
    }

    return contentElement;
  };

  /**
   * Render the complete layout structure
   */
  const layoutContent = (
    <div className={layoutClasses}>
      {/* Loading overlay */}
      {renderLoadingOverlay()}

      {/* Header - wrapped in its own error boundary */}
      <ErrorBoundary
        name="LayoutHeader"
        onError={handleLayoutError}
        showRetry={false}
      >
        <Header user={user} onLogout={onLogout} />
      </ErrorBoundary>

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebar && (
          <ErrorBoundary
            name="LayoutSidebar"
            onError={handleLayoutError}
            showRetry={false}
          >
            <aside
              className="w-64 bg-white shadow-sm border-r border-gray-200 hidden lg:block"
              role="complementary"
              aria-label="Sidebar navigation"
            >
              {sidebar}
            </aside>
          </ErrorBoundary>
        )}

        {/* Main content area */}
        <main
          className="flex-1 flex flex-col"
          role="main"
          aria-label="Main content"
        >
          {renderContent()}

          {/* Footer */}
          {footer && (
            <ErrorBoundary
              name="LayoutFooter"
              onError={handleLayoutError}
              showRetry={false}
            >
              <Footer />
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );

  // Wrap entire layout in error boundary if enabled
  if (errorBoundary.enabled) {
    return (
      <ErrorBoundary
        name={errorBoundary.name || 'Layout'}
        onError={handleLayoutError}
        fallback={errorBoundary.fallback}
      >
        {layoutContent}
      </ErrorBoundary>
    );
  }

  return layoutContent;
};

/**
 * Memoized Footer component for better performance
 */
const Footer: React.FC = React.memo(() => {
  return (
    <footer
      className="bg-white border-t border-gray-200 mt-auto"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              © {new Date().getFullYear()} Applied Behavioral Holistic Health
            </span>
          </div>

          <nav
            className="flex items-center space-x-6"
            role="navigation"
            aria-label="Footer navigation"
          >
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
            >
              Terms of Service
            </a>
            <a
              href="/support"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
            >
              Support
            </a>
          </nav>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Secure interview platform powered by AWS
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default React.memo(Layout);
export { Footer };