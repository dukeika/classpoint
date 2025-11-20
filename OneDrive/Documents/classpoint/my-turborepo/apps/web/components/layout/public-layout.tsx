/**
 * Public Layout
 * Layout for public pages (landing, CMS, marketing)
 */

import { ReactNode } from 'react';
import { PublicNavbar } from './public-navbar';
import { PublicFooter } from './public-footer';
import { cn } from '@/lib/utils';

interface PublicLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className={cn('flex-1', className)}>{children}</main>
      <PublicFooter />
    </div>
  );
}
