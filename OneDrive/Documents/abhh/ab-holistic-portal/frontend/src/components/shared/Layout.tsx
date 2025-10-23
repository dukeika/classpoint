/**
 * Application Layout Component
 */

import React from 'react';
import Head from 'next/head';
import Header from './Header';
import { AuthProvider } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  maxWidth?: 'full' | 'screen' | '7xl' | '6xl' | '5xl';
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'AB Holistic Interview Portal',
  description = 'Secure cloud-native recruitment platform for AB Holistic Health',
  showHeader = true,
  showNavigation = true,
  maxWidth = '7xl',
  className = '',
}) => {
  const maxWidthClasses = {
    full: 'max-w-full',
    screen: 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {showHeader && (
          <Header showNavigation={showNavigation} />
        )}

        <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>&copy; 2025 Applied Behavioral Holistic Health. All rights reserved.</p>
              <p className="mt-2 text-sm">Secure cloud-native recruitment platform</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

// Layout with Auth Provider wrapper
const AuthenticatedLayout: React.FC<LayoutProps> = (props) => {
  return (
    <AuthProvider>
      <Layout {...props} />
    </AuthProvider>
  );
};

export default Layout;
export { AuthenticatedLayout };