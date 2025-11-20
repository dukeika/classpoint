'use client';

/**
 * React Query Provider
 * Wraps the application with QueryClientProvider and provides default configuration
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { ApiClientError } from '../api-client';

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * Create Query Client with default configuration
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes (data considered fresh for 5 minutes)
        staleTime: 5 * 60 * 1000,

        // Cache time: 10 minutes (unused data stays in cache for 10 minutes)
        gcTime: 10 * 60 * 1000,

        // Retry failed requests 3 times
        retry: (failureCount, error) => {
          // Don't retry on client errors (4xx)
          if (error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },

        // Retry delay: exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (useful for keeping data fresh)
        refetchOnWindowFocus: true,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,

        // Don't retry on client errors
        retryDelay: 1000,

        // Error handler for mutations
        onError: (error) => {
          console.error('Mutation error:', error);

          // You can add global error handling here
          // For example, show a toast notification
        },
      },
    },
  });
}

/**
 * React Query Provider Component
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a new QueryClient instance for each render
  // This ensures proper SSR/client hydration
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
