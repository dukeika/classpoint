'use client'

import { Amplify } from 'aws-amplify'
import { amplifyConfig } from './amplify-config'
import { useEffect } from 'react'

// Configure Amplify
Amplify.configure(amplifyConfig, { ssr: true })

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure Amplify is configured on client side
    Amplify.configure(amplifyConfig, { ssr: true })
  }, [])

  return <>{children}</>
}
