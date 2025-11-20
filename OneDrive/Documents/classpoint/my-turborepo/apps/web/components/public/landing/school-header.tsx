'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Tenant } from '@/lib/types'

interface SchoolHeaderProps {
  tenant: Tenant
}

export function SchoolHeader({ tenant }: SchoolHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              {tenant.logo ? (
                <Image
                  src={tenant.logo}
                  alt={tenant.schoolName}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              ) : (
                <span className="text-xl font-heading font-bold text-primary-700">
                  {tenant.schoolName}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#about"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="#programs"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Programs
            </Link>
            <Link
              href="#admissions"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Admissions
            </Link>
            <Link
              href="#contact"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/portal"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Student Portal
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-primary-600 p-2"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="#about"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              >
                About
              </Link>
              <Link
                href="#programs"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              >
                Programs
              </Link>
              <Link
                href="#admissions"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              >
                Admissions
              </Link>
              <Link
                href="#contact"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/portal"
                onClick={closeMobileMenu}
                className="block px-3 py-2 mx-3 mt-4 text-center bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Student Portal
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
