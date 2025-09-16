import React from 'react';
import { clsx } from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
import NotificationCenter from '../notifications/NotificationCenter';

export interface HeaderProps {
  className?: string;
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'applicant';
    avatar?: string;
  } | null | undefined;
  onLogout?: (() => void) | undefined;
}

const Header = ({ className, user, onLogout }: HeaderProps) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);

  return (
    <header
      className={clsx(
        'bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-lg flex items-center justify-center">
                <span className="text-[#F5E942] font-bold text-lg">AB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#2D5A4A]">
                  AB Holistic
                </span>
                <span className="text-xs text-gray-500">
                  Interview Portal
                </span>
              </div>
            </Link>

            {/* Navigation Menu */}
            {user && (
              <nav className="hidden md:flex items-center space-x-6">
                {user.role === 'admin' ? (
                  <>
                    <Link href="/admin/dashboard" className="text-gray-600 hover:text-[#2D5A4A] font-medium">
                      Dashboard
                    </Link>
                    <Link href="/admin/jobs" className="text-gray-600 hover:text-[#2D5A4A] font-medium">
                      Jobs
                    </Link>
                    <Link href="/jobs" className="text-gray-600 hover:text-[#2D5A4A] font-medium">
                      Public View
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/applicant/dashboard" className="text-gray-600 hover:text-[#2D5A4A] font-medium">
                      Dashboard
                    </Link>
                    <Link href="/jobs" className="text-gray-600 hover:text-[#2D5A4A] font-medium">
                      Browse Jobs
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Navigation or Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Center */}
                <NotificationCenter />

                <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
                >
                  <div className="flex flex-col text-right">
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-primary-600 font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <svg
                    className={clsx(
                      'h-4 w-4 text-gray-400 transition-transform duration-200',
                      isProfileMenuOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      {user.role === 'admin' ? (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/applicant/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          My Applications
                        </Link>
                      )}
                      <Link
                        href="/jobs"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Browse Jobs
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout?.();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Apply Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;