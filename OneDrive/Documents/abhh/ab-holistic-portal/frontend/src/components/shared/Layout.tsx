import React from 'react';
import { clsx } from 'clsx';
import Header from './Header';

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
  padding?: boolean;
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'applicant';
    avatar?: string;
  } | null;
  onLogout?: () => void;
  sidebar?: React.ReactNode;
  footer?: boolean;
}

const Layout = ({
  children,
  className,
  maxWidth = '7xl',
  padding = true,
  user,
  onLogout,
  sidebar,
  footer = true,
}: LayoutProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={onLogout} />

      <div className="flex flex-1">
        {sidebar && (
          <aside className="w-64 bg-white shadow-sm border-r border-gray-200 hidden lg:block">
            {sidebar}
          </aside>
        )}

        <main className="flex-1 flex flex-col">
          <div
            className={clsx(
              'flex-1',
              maxWidthClasses[maxWidth],
              padding && 'px-4 sm:px-6 lg:px-8 py-8',
              !sidebar && 'mx-auto',
              className
            )}
          >
            {children}
          </div>

          {footer && <Footer />}
        </main>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              © 2025 Applied Behavioral Holistic Health
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/support"
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Support
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Secure interview platform powered by AWS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Layout;