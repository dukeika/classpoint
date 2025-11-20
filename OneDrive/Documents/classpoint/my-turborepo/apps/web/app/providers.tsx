'use client'

/**
 * Application Providers
 * Wraps the application with all necessary providers
 */

import { AppProvider } from '@/lib/providers'
// import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
      {/* Global toast notifications */}
      {/* <Toaster /> */}
    </AppProvider>
  )
}
