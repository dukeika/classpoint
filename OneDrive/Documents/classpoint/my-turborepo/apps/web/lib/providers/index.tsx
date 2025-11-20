'use client';

/**
 * Combined Providers
 * Exports all application providers and a combined AppProvider
 */

import { type ReactNode } from 'react';
import { ReactQueryProvider } from './react-query-provider';

export { ReactQueryProvider } from './react-query-provider';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Combined App Provider
 * Wraps all application-level providers
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <ReactQueryProvider>
      {/* Add other providers here as needed */}
      {/* Example: <AuthProvider>, <ThemeProvider>, etc. */}
      {children}
    </ReactQueryProvider>
  );
}
