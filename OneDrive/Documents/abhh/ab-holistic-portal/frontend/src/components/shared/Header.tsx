/**
 * Application Header Component
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser, useIsAdmin, useIsApplicant } from '../../contexts/AuthContext';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface HeaderProps {
  showNavigation?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showNavigation = true }) => {
  const { state, actions } = useAuth();
  const user = useUser();
  const isAdmin = useIsAdmin();
  const isApplicant = useIsApplicant();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await actions.logout({ redirectTo: '/' });
  };

  const navigationItems = React.useMemo(() => {
    if (!user) return [];

    if (isAdmin) {
      return [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/jobs', label: 'Jobs' },
        { href: '/admin/applications', label: 'Applications' },
        { href: '/admin/users', label: 'Users' },
      ];
    }

    if (isApplicant) {
      return [
        { href: '/applicant/dashboard', label: 'Dashboard' },
        { href: '/jobs', label: 'Browse Jobs' },
        { href: '/applicant/applications', label: 'My Applications' },
        { href: '/applicant/profile', label: 'Profile' },
      ];
    }

    return [];
  }, [user, isAdmin, isApplicant]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="AB Holistic Health"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <div className="text-lg font-semibold text-gray-900">
                AB Holistic Health
              </div>
              <p className="text-xs text-gray-500">Interview Portal</p>
            </div>
          </Link>

          {/* Navigation - Always render nav element for accessibility */}
          <nav className="hidden md:flex items-center space-x-6">
            {showNavigation && user && navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
            {/* Public navigation links */}
            {!user && (
              <>
                <Link
                  href="/jobs"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  Browse Jobs
                </Link>
                <Link
                  href="/about"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  About
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {state.status === 'loading' ? (
              <LoadingSpinner size="sm" />
            ) : user ? (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600 capitalize mt-1">
                        {user.role.replace('_', ' ')}
                      </p>
                    </div>

                    {/* Mobile Navigation */}
                    {showNavigation && (
                      <div className="md:hidden border-b border-gray-100 py-2">
                        {navigationItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Account Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.login({ redirectTo: window.location.href })}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;