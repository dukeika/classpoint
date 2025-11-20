import Link from 'next/link'
import type { Tenant } from '@/lib/types'

interface SchoolFooterProps {
  tenant: Tenant
}

export function SchoolFooter({ tenant }: SchoolFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* School Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white text-lg font-heading font-semibold mb-4">
              {tenant.schoolName}
            </h3>
            {tenant.address && (
              <p className="text-sm mb-2">
                <span className="font-medium">Address:</span>
                <br />
                {tenant.address}
              </p>
            )}
            {tenant.phone && (
              <p className="text-sm mb-2">
                <span className="font-medium">Phone:</span> {tenant.phone}
              </p>
            )}
            {tenant.email && (
              <p className="text-sm">
                <span className="font-medium">Email:</span> {tenant.email}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#programs" className="hover:text-white transition-colors">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="#admissions" className="hover:text-white transition-colors">
                  Admissions
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Portal Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Portal Access
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/portal" className="hover:text-white transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-white transition-colors">
                  Parent Portal
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-white transition-colors">
                  Teacher Portal
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-white transition-colors">
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>
            © {currentYear} {tenant.schoolName}. All rights reserved.
          </p>
          <p className="mt-2 text-gray-500">
            Powered by{' '}
            <a
              href="https://classpoint.com"
              className="text-primary-400 hover:text-primary-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              ClassPoint
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
