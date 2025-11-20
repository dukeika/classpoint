import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - ClassPoint',
  description: 'Login to ClassPoint School Management System',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
