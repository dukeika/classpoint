'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'

interface NavItem {
  name: string
  href: string
  icon: string
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Students',
    href: '/dashboard/students',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  },
  {
    name: 'Classes',
    href: '/dashboard/classes',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  },
  {
    name: 'Enrollments',
    href: '/dashboard/enrollments',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  },
  {
    name: 'Attendance',
    href: '/dashboard/attendance',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  },
  {
    name: 'Assessments',
    href: '/dashboard/assessments',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  },
  {
    name: 'Households',
    href: '/dashboard/households',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const canAccessItem = (item: NavItem) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  }

  return (
    <div className="flex flex-col w-64 bg-gray-900 h-screen">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">ClassPoint</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {navigation.filter(canAccessItem).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <svg
                  className={cn('mr-3 h-5 w-5', isActive ? 'text-white' : 'text-gray-400')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User info */}
      <div className="flex items-center p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  )
}
