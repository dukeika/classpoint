import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
import NotificationCenter from '../notifications/NotificationCenter';
import { UserRole } from '../../types/auth';

/**
 * User information for header display
 */
interface HeaderUser {
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's role */
  role: UserRole;
  /** Optional avatar URL */
  avatar?: string;
  /** User ID for analytics */
  id?: string;
}

/**
 * Props for Header component
 */
export interface HeaderProps {
  /** Additional CSS classes */
  className?: string;
  /** Current authenticated user */
  user?: HeaderUser | null;
  /** Logout handler */
  onLogout?: () => void;
  /** Whether header should be sticky */
  sticky?: boolean;
  /** Header variant */
  variant?: 'default' | 'minimal' | 'transparent';
  /** Whether to show notifications */
  showNotifications?: boolean;
  /** Custom logo URL */
  logoUrl?: string;
  /** Custom brand name */
  brandName?: string;
  /** Whether to show navigation menu */
  showNavigation?: boolean;
}

/**
 * Navigation menu item interface
 */
interface NavMenuItem {
  href: string;
  label: string;
  ariaLabel?: string;
  isActive?: boolean;
}

/**
 * Enhanced Header component with improved accessibility and type safety
 */
const Header: React.FC<HeaderProps> = ({
  className,
  user,
  onLogout,
  sticky = true,
  variant = 'default',
  showNotifications = true,
  logoUrl,
  brandName = 'AB Holistic',
  showNavigation = true,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Get navigation items based on user role
   */
  const navigationItems = useMemo((): NavMenuItem[] => {
    if (!user || !showNavigation) return [];

    const baseItems: NavMenuItem[] = [];

    switch (user.role) {
      case 'admin':
      case 'superadmin':
        return [
          { href: '/admin/dashboard', label: 'Dashboard', ariaLabel: 'Go to admin dashboard' },
          { href: '/admin/jobs', label: 'Jobs', ariaLabel: 'Manage job postings' },
          { href: '/jobs', label: 'Public View', ariaLabel: 'View public job listings' },
        ];
      case 'applicant':
        return [
          { href: '/applicant/dashboard', label: 'Dashboard', ariaLabel: 'Go to applicant dashboard' },
          { href: '/jobs', label: 'Browse Jobs', ariaLabel: 'Browse available job opportunities' },
        ];
      default:
        return baseItems;
    }
  }, [user, showNavigation]);

  /**
   * Header variant styles
   */
  const headerStyles = useMemo(() => {
    const baseClasses = 'z-40 transition-all duration-200';
    const stickyClasses = sticky ? 'sticky top-0' : '';

    const variantClasses = {
      default: 'bg-white shadow-sm border-b border-gray-200',
      minimal: 'bg-white border-b border-gray-100',
      transparent: 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50',
    };

    return clsx(baseClasses, stickyClasses, variantClasses[variant], className);
  }, [sticky, variant, className]);

  /**
   * Close profile menu
   */
  const closeProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(false);
  }, []);

  /**
   * Toggle profile menu
   */
  const toggleProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(prev => !prev);
  }, []);

  /**
   * Handle logout with menu close
   */
  const handleLogout = useCallback(() => {
    closeProfileMenu();
    onLogout?.();
  }, [closeProfileMenu, onLogout]);

  /**
   * Handle escape key press
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isProfileMenuOpen) {
        closeProfileMenu();
        profileButtonRef.current?.focus();
      }
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
  }, [isProfileMenuOpen, isMobileMenuOpen, closeProfileMenu]);

  /**
   * Click outside handler
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target as Node) &&
      !profileButtonRef.current?.contains(event.target as Node)
    ) {
      closeProfileMenu();
    }
  }, [closeProfileMenu]);

  // Setup event listeners
  useEffect(() => {
    if (isProfileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    // Return undefined for the else case
    return undefined;
  }, [isProfileMenuOpen, handleKeyDown, handleClickOutside]);

  /**
   * Get user initials for avatar fallback
   */
  const getUserInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <header
      className={headerStyles}
      role="banner"
      aria-label="Site header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label={`${brandName} Interview Portal - Go to homepage`}
            >
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-lg flex items-center justify-center">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${brandName} logo`}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                ) : (
                  <span className="text-[#F5E942] font-bold text-lg" aria-hidden="true">
                    AB
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#2D5A4A]">
                  {brandName}
                </span>
                <span className="text-xs text-gray-500">
                  Interview Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Menu */}
            {navigationItems.length > 0 && (
              <nav
                className="hidden md:flex items-center space-x-6"
                role="navigation"
                aria-label="Main navigation"
              >
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-600 hover:text-[#2D5A4A] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    aria-label={item.ariaLabel || item.label}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* User Actions and Authentication */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Center */}
                {showNotifications && <NotificationCenter />}

                {/* Mobile Menu Button */}
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Open mobile menu"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Profile Menu */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    ref={profileButtonRef}
                    type="button"
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-50"
                    aria-label="Open user menu"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                    id="user-menu-button"
                  >
                    <div className="flex flex-col text-right">
                      <span className="font-medium text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {user.role}
                      </span>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={`${user.name}'s avatar`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-blue-600 font-medium" aria-hidden="true">
                          {getUserInitials(user.name)}
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
                      aria-hidden="true"
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
                        onClick={closeProfileMenu}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          Profile Settings
                        </Link>
                        {user.role === 'admin' || user.role === 'superadmin' ? (
                          <Link
                            href="/admin/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={closeProfileMenu}
                            role="menuitem"
                          >
                            Admin Dashboard
                          </Link>
                        ) : (
                          <Link
                            href="/applicant/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={closeProfileMenu}
                            role="menuitem"
                          >
                            My Applications
                          </Link>
                        )}
                        <Link
                          href="/jobs"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          Browse Jobs
                        </Link>
                        <div className="border-t border-gray-100 my-1" role="separator" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          role="menuitem"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Unauthenticated User Actions */
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/auth/register"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <Button variant="primary" size="sm">
                    Apply Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && user && navigationItems.length > 0 && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav
              className="px-4 py-3 space-y-1"
              role="navigation"
              aria-label="Mobile navigation"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#2D5A4A] hover:bg-gray-50 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={item.ariaLabel || item.label}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Add display name for debugging
Header.displayName = 'Header';

export default React.memo(Header);
export type { HeaderUser };