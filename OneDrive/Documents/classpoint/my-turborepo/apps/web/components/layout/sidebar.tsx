'use client';

/**
 * Sidebar Navigation Component
 * Main navigation for dashboard pages
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UsersRound,
  BookOpen,
  ClipboardList,
  Calendar,
  DollarSign,
  Home,
  Megaphone,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface SidebarProps {
  role?: 'admin' | 'teacher' | 'student' | 'parent';
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('admin' | 'teacher' | 'student' | 'parent')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'student', 'parent'],
  },
  {
    title: 'Students',
    href: '/dashboard/students',
    icon: GraduationCap,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'Teachers',
    href: '/dashboard/teachers',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Parents',
    href: '/dashboard/parents',
    icon: UsersRound,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'Classes',
    href: '/dashboard/classes',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    title: 'Attendance',
    href: '/dashboard/attendance',
    icon: ClipboardList,
    roles: ['admin', 'teacher'],
  },
  {
    title: 'Assignments',
    href: '/dashboard/assignments',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
    roles: ['admin', 'teacher', 'student', 'parent'],
  },
  {
    title: 'Fees',
    href: '/dashboard/fees',
    icon: DollarSign,
    roles: ['admin', 'parent'],
  },
  {
    title: 'Announcements',
    href: '/dashboard/announcements',
    icon: Megaphone,
    roles: ['admin', 'teacher', 'student', 'parent'],
  },
  {
    title: 'Households',
    href: '/dashboard/households',
    icon: Home,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin', 'teacher', 'student', 'parent'],
  },
];

export function Sidebar({ role = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">ClassPoint</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn('h-8 w-8', collapsed && 'mx-auto')}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* User Info/Footer */}
        <div className="p-4">
          {!collapsed && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium capitalize">{role} Portal</p>
              <p>ClassPoint v1.0</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
