'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Tenant } from '../types'

interface TenantContextType {
  tenant: Tenant | null
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({
  children,
  tenant,
  isLoading = false,
}: {
  children: ReactNode
  tenant: Tenant | null
  isLoading?: boolean
}) {
  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
