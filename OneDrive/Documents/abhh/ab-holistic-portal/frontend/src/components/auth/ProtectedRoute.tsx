import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'admin' | 'applicant';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRole,
  redirectTo = '/auth/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (requireRole && user?.role !== requireRole) {
        // Redirect to appropriate dashboard based on user role
        if (user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user?.role === 'applicant') {
          router.push('/applicant/dashboard');
        } else {
          router.push('/auth/login');
        }
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, requireRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will handle redirect
  }

  if (requireRole && user?.role !== requireRole) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
};

export default ProtectedRoute;