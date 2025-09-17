import React, { useCallback, useMemo } from 'react';
import {
  ErrorBoundary,
  AsyncErrorBoundary,
  Layout,
  Card,
  Button,
  LoadingSpinner,
  useAsync,
  usePerformanceMonitor,
  useDebounce,
  useIntersectionObserver,
} from '../shared';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Mock API functions for demonstration
 */
const mockFetchDashboardData = async (): Promise<{
  stats: { applications: number; interviews: number; offers: number };
  recentActivity: Array<{ id: string; type: string; message: string; timestamp: string }>;
}> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate occasional errors for testing
  if (Math.random() < 0.1) {
    throw new Error('Failed to load dashboard data');
  }

  return {
    stats: {
      applications: 24,
      interviews: 8,
      offers: 2,
    },
    recentActivity: [
      {
        id: '1',
        type: 'application',
        message: 'New application submitted for Software Engineer position',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'interview',
        message: 'Interview scheduled for tomorrow at 2:00 PM',
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

/**
 * Dashboard Stats Component with performance monitoring
 */
const DashboardStats: React.FC<{
  stats: { applications: number; interviews: number; offers: number };
}> = React.memo(({ stats }) => {
  const { logRender } = usePerformanceMonitor({
    name: 'DashboardStats',
    warnOnSlowRender: true,
  });

  // Log render for performance monitoring
  React.useEffect(() => {
    logRender();
  });

  const statItems = useMemo(() => [
    { label: 'Applications', value: stats.applications, color: 'bg-blue-500' },
    { label: 'Interviews', value: stats.interviews, color: 'bg-green-500' },
    { label: 'Offers', value: stats.offers, color: 'bg-purple-500' },
  ], [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statItems.map((item) => (
        <Card key={item.label} className="p-6">
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${item.color} mr-3`} />
            <div>
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

/**
 * Recent Activity Component with lazy loading
 */
const RecentActivity: React.FC<{
  activities: Array<{ id: string; type: string; message: string; timestamp: string }>;
}> = React.memo(({ activities }) => {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  const { logRender } = usePerformanceMonitor({
    name: 'RecentActivity',
  });

  React.useEffect(() => {
    if (isVisible) {
      logRender();
    }
  }, [isVisible, logRender]);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      {isVisible ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      </Card>
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';

/**
 * Search Component with debouncing
 */
const DashboardSearch: React.FC<{
  onSearch: (query: string) => void;
}> = React.memo(({ onSearch }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  React.useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search dashboard..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
});

DashboardSearch.displayName = 'DashboardSearch';

/**
 * Enhanced Dashboard Component demonstrating all improvements
 */
const EnhancedDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [, setSearchQuery] = React.useState('');

  // Performance monitoring for the main component
  const { logRender, metrics } = usePerformanceMonitor({
    name: 'EnhancedDashboard',
    logMetrics: true,
    warnOnSlowRender: true,
  });

  // Async data fetching with comprehensive error handling
  const {
    data: dashboardData,
    isLoading,
    error,
    execute: fetchDashboard,
  } = useAsync(mockFetchDashboardData, {
    immediate: true,
    onSuccess: (data) => {
      console.log('Dashboard data loaded successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to load dashboard:', error);
    },
    timeout: 10000, // 10 second timeout
  });

  // Search handler with useCallback for performance
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // In a real app, this would filter the data or make an API call
    console.log('Searching for:', query);
  }, []);

  // Log render for performance monitoring
  React.useEffect(() => {
    logRender();
  });

  // Custom error fallback for dashboard-specific errors
  const DashboardErrorFallback = useCallback(
    ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
      <Card className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <div className="space-x-2">
          <Button onClick={resetErrorBoundary} variant="primary" size="sm">
            Try Again
          </Button>
          <Button onClick={fetchDashboard} variant="outline" size="sm">
            Reload Data
          </Button>
        </div>
      </Card>
    ),
    [fetchDashboard]
  );

  return (
    <Layout
      user={user}
      onLogout={logout}
      errorBoundary={{
        enabled: true,
        name: 'DashboardLayout',
        onError: (error, errorInfo) => {
          console.error('Dashboard layout error:', error, errorInfo);
        },
      }}
      asyncErrorBoundary={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>

          {/* Performance metrics (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Renders: {metrics.renderCount} |
              Avg: {metrics.averageRenderTime.toFixed(2)}ms |
              Peak: {metrics.peakRenderTime.toFixed(2)}ms
            </div>
          )}
        </div>

        {/* Search */}
        <DashboardSearch onSearch={handleSearch} />

        {/* Main Dashboard Content */}
        <AsyncErrorBoundary
          name="DashboardContent"
          fallback={DashboardErrorFallback}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="p-8 text-center border-red-200 bg-red-50">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Dashboard</h3>
              <p className="text-red-700 mb-4">{error.message}</p>
              <Button onClick={() => fetchDashboard()} variant="primary" size="sm">
                Try Again
              </Button>
            </Card>
          ) : dashboardData ? (
            <>
              {/* Dashboard Stats with Error Boundary */}
              <ErrorBoundary name="DashboardStats" showRetry={false}>
                <DashboardStats stats={dashboardData.stats} />
              </ErrorBoundary>

              {/* Recent Activity with Error Boundary */}
              <ErrorBoundary name="RecentActivity" showRetry={false}>
                <RecentActivity activities={dashboardData.recentActivity} />
              </ErrorBoundary>
            </>
          ) : null}
        </AsyncErrorBoundary>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button onClick={fetchDashboard} variant="outline">
            Refresh Data
          </Button>
          <Button onClick={() => console.log('Export clicked')} variant="primary">
            Export Report
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default React.memo(EnhancedDashboard);