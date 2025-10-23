/**
 * Protected Route Component for AB Holistic Interview Portal
 * Provides route-level authentication and authorization
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useIsAuthenticated } from '../../contexts/AuthContext';
import { ProtectedRouteProps, UserRole, Permission } from '../../types/auth';
import { AuthUtils } from '../../services/auth';

/**
 * Loading skeleton component
 */
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="animate-pulse">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Unauthorized access component
 */
const UnauthorizedAccess: React.FC<{
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  onGoBack: () => void;
  onLogin: () => void;
}> = ({ requiredRole, requiredPermissions, onGoBack, onLogin }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center">
          {/* Unauthorized icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Access Denied
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            {requiredRole
              ? `This page requires ${requiredRole} access.`
              : requiredPermissions?.length
                ? 'You do not have the required permissions to view this page.'
                : 'You need to be signed in to view this page.'
            }
          </p>

          {/* Required permissions display */}
          {requiredPermissions && requiredPermissions.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 mb-2">Required permissions:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                {requiredPermissions.map((permission, index) => (
                  <li key={index}>
                    {permission.action} access to {permission.resource}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={onLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={onGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Check if user meets role requirements
 */
const checkRoleAccess = (userRole: UserRole, requiredRole: UserRole): boolean => {
  // Admin has access to everything
  if (userRole === 'admin') return true;

  // Exact role match
  return userRole === requiredRole;
};

/**
 * Check if user has required permissions
 */
const checkPermissions = (
  userRole: UserRole,
  requiredPermissions: Permission[],
  hasPermission: (resource: string, action: string) => boolean
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  return requiredPermissions.every(permission =>
    hasPermission(permission.resource, permission.action)
  );
};

/**
 * Protected route component
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  componentProps = {},
  requiredRole,
  requiredPermissions,
  redirectPath = '/auth/login',
  showLoading = true,
  unauthorizedComponent: UnauthorizedComponent,
}) => {
  const router = useRouter();
  const { state, actions } = useAuth();
  const isAuthenticated = useIsAuthenticated();

  /**
   * Handle redirect to login
   */
  const handleRedirectToLogin = () => {
    const currentPath = router.asPath;
    const loginPath = `${redirectPath}?redirect=${encodeURIComponent(currentPath)}`;
    router.push(loginPath);
  };

  /**
   * Handle go back action
   */
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  /**
   * Handle login action
   */
  const handleLogin = () => {
    const currentPath = router.asPath;
    actions.login({ redirectTo: currentPath });
  };

  /**
   * For SPA deployment, don't redirect - show login UI inline
   * Commenting out redirect to prevent CloudFront routing issues
   */
  // useEffect(() => {
  //   if (state.status === 'unauthenticated') {
  //     handleRedirectToLogin();
  //   }
  // }, [state.status]);

  // Show loading state
  if (state.status === 'loading' && showLoading) {
    return <LoadingSkeleton />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (UnauthorizedComponent) {
      return <UnauthorizedComponent />;
    }

    return (
      <UnauthorizedAccess
        requiredRole={requiredRole}
        requiredPermissions={requiredPermissions}
        onGoBack={handleGoBack}
        onLogin={handleLogin}
      />
    );
  }

  // Check role access
  if (requiredRole && !checkRoleAccess(state.user!.role, requiredRole)) {
    if (UnauthorizedComponent) {
      return <UnauthorizedComponent />;
    }

    return (
      <UnauthorizedAccess
        requiredRole={requiredRole}
        requiredPermissions={requiredPermissions}
        onGoBack={handleGoBack}
        onLogin={handleLogin}
      />
    );
  }

  // Check permissions
  if (requiredPermissions && !checkPermissions(
    state.user!.role,
    requiredPermissions,
    actions.hasPermission
  )) {
    if (UnauthorizedComponent) {
      return <UnauthorizedComponent />;
    }

    return (
      <UnauthorizedAccess
        requiredRole={requiredRole}
        requiredPermissions={requiredPermissions}
        onGoBack={handleGoBack}
        onLogin={handleLogin}
      />
    );
  }

  // User is authorized, render the component
  return <Component {...componentProps} />;
};

/**
 * Higher-order component for protecting routes
 */
export const withProtectedRoute = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  protection: Omit<ProtectedRouteProps, 'component' | 'componentProps'>
) => {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute
      component={Component}
      componentProps={props}
      {...protection}
    />
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;

  return ProtectedComponent;
};

/**
 * Hook for checking route access
 */
export const useRouteAccess = (options: {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
}) => {
  const { state, actions } = useAuth();
  const isAuthenticated = useIsAuthenticated();

  const hasAccess = React.useMemo(() => {
    if (!isAuthenticated || !state.user) return false;

    // Check role access
    if (options.requiredRole && !checkRoleAccess(state.user.role, options.requiredRole)) {
      return false;
    }

    // Check permissions
    if (options.requiredPermissions && !checkPermissions(
      state.user.role,
      options.requiredPermissions,
      actions.hasPermission
    )) {
      return false;
    }

    return true;
  }, [isAuthenticated, state.user, options.requiredRole, options.requiredPermissions, actions.hasPermission]);

  return {
    hasAccess,
    isAuthenticated,
    user: state.user,
    isLoading: state.status === 'loading',
  };
};

/**
 * Route protection utilities
 */
export const RouteProtectionUtils = {
  /**
   * Create admin-only route protection
   */
  adminOnly: (redirectPath?: string): Omit<ProtectedRouteProps, 'component' | 'componentProps'> => ({
    requiredRole: 'admin',
    redirectPath,
  }),

  /**
   * Create applicant-only route protection
   */
  applicantOnly: (redirectPath?: string): Omit<ProtectedRouteProps, 'component' | 'componentProps'> => ({
    requiredRole: 'applicant',
    redirectPath,
  }),

  /**
   * Create permission-based route protection
   */
  requirePermissions: (
    permissions: Permission[],
    redirectPath?: string
  ): Omit<ProtectedRouteProps, 'component' | 'componentProps'> => ({
    requiredPermissions: permissions,
    redirectPath,
  }),

  /**
   * Create authentication-only route protection
   */
  requireAuth: (redirectPath?: string): Omit<ProtectedRouteProps, 'component' | 'componentProps'> => ({
    redirectPath,
  }),
};

export default ProtectedRoute;
export { ProtectedRoute };