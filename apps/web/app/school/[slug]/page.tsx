'use client'

import { useTenant } from '@/lib/contexts/tenant-context'
import { HeroSection } from '@/components/public/sections/hero-section'
import { AboutSection } from '@/components/public/sections/about-section'
import { ContactSection } from '@/components/public/sections/contact-section'
import { SchoolHeader } from '@/components/public/landing/school-header'
import { SchoolFooter } from '@/components/public/landing/school-footer'

export default function SchoolLandingPage() {
  const { tenant, isLoading } = useTenant()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">School Not Found</h1>
          <p className="text-gray-600 mt-2">
            The school you are looking for does not exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader tenant={tenant} />

      <main>
        <HeroSection tenant={tenant} />
        <AboutSection tenant={tenant} />
        <ContactSection tenant={tenant} />
      </main>

      <SchoolFooter tenant={tenant} />
    </div>
  )
}
