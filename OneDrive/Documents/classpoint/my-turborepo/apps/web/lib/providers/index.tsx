'use client';

/**
 * Combined Providers
 * Exports all application providers and a combined AppProvider
 */

import { type ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { ReactQueryProvider } from './react-query-provider';
import { AuthInitializer } from '@/components/auth/auth-initializer';
import { amplifyConfig } from '@/lib/auth/amplify-config';

export { ReactQueryProvider } from './react-query-provider';

// Configure Amplify once at module load (supports SSR and client)
Amplify.configure(amplifyConfig, { ssr: true });

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
      {/* Initialize authentication state */}
      <AuthInitializer />
      {children}
    </ReactQueryProvider>
  );
}
