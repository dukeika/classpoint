import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { TenantProvider } from '@/lib/contexts/tenant-context'
import type { Metadata } from 'next'
import type { Tenant } from '@/lib/types'

async function getTenantData(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/tenants/by-slug/${slug}`, {
      cache: 'no-store', // Always get fresh data for tenant info
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const tenant = await getTenantData(resolvedParams.slug) as Tenant | null

  if (!tenant) {
    return {
      title: 'School Not Found',
      description: 'The school you are looking for does not exist.',
    }
  }

  const title = `${tenant.schoolName} - ${tenant.tagline || 'Quality Education'}`
  const description =
    tenant.description ||
    `Welcome to ${tenant.schoolName}. Discover excellence in education with our comprehensive programs and dedicated staff.`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://classpoint.com'
  const schoolUrl = `${siteUrl}/school/${resolvedParams.slug}`

  return {
    title,
    description,
    keywords: [
      tenant.schoolName,
      'school',
      'education',
      'learning',
      'students',
      'admissions',
      'academic excellence',
    ],
    authors: [{ name: tenant.schoolName }],
    creator: tenant.schoolName,
    publisher: tenant.schoolName,
    alternates: {
      canonical: schoolUrl,
    },
    openGraph: {
      title,
      description,
      url: schoolUrl,
      siteName: tenant.schoolName,
      images: tenant.heroImage
        ? [
            {
              url: tenant.heroImage,
              width: 1200,
              height: 630,
              alt: `${tenant.schoolName} campus`,
            },
          ]
        : [],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: tenant.heroImage ? [tenant.heroImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }
}

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const headersList = await headers()
  const resolvedParams = await params
  const tenantSlug = headersList.get('x-tenant-slug') || resolvedParams.slug

  const tenant = await getTenantData(tenantSlug)

  if (!tenant || !tenant.isActive) {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://classpoint.com'
  const schoolUrl = `${siteUrl}/school/${resolvedParams.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: tenant.schoolName,
    description:
      tenant.description ||
      `${tenant.schoolName} provides quality education and comprehensive programs.`,
    url: schoolUrl,
    logo: tenant.logo,
    image: tenant.heroImage,
    address: tenant.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: tenant.address,
        }
      : undefined,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: tenant.phone,
      email: tenant.email,
      contactType: 'Admissions',
    },
    sameAs: tenant.website ? [tenant.website] : [],
    foundingDate: tenant.yearEstablished
      ? new Date(tenant.yearEstablished, 0, 1).toISOString()
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TenantProvider tenant={tenant}>{children}</TenantProvider>
    </>
  )
}
