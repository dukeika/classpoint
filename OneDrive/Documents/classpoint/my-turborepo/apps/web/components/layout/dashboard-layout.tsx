'use client';

/**
 * Dashboard Layout
 * Main layout for authenticated dashboard pages
 */

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: 'admin' | 'teacher' | 'student' | 'parent';
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  className?: string;
}

export function DashboardLayout({
  children,
  role = 'admin',
  user,
  className,
}: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Main Content */}
      <div className="pl-64 transition-all duration-300">
        {/* Header */}
        <Header user={user} />

        {/* Page Content */}
        <main className={cn('p-4 sm:p-6 lg:p-8', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
