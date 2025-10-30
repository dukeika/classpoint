import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Get the pathname
  const pathname = url.pathname

  // Extract subdomain from hostname
  // Expected formats:
  // - classpoint.com (main site)
  // - app.classpoint.com (application portal)
  // - schoolname.classpoint.com (school public site)
  // - localhost:3000 (development)
  // - *.amplifyapp.com (AWS Amplify preview URLs)

  // Skip middleware for Amplify preview URLs
  if (hostname.includes('amplifyapp.com')) {
    return NextResponse.next()
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'classpoint.com'

  const currentHost =
    process.env.NODE_ENV === 'production'
      ? hostname.replace(`.${rootDomain}`, '')
      : hostname.replace(`.localhost:3000`, '')

  // Remove port if present
  const subdomain = currentHost.split(':')[0] || ''

  // Main domain (no subdomain)
  if (
    subdomain === rootDomain ||
    subdomain === 'localhost' ||
    subdomain === 'classpoint.com' ||
    subdomain === hostname // No subdomain detected
  ) {
    // Main marketing site - allow through
    return NextResponse.next()
  }

  // Application portal subdomain (app.classpoint.com)
  if (subdomain === 'app' || subdomain === 'portal') {
    // Rewrite to /app routes (authenticated application)
    if (pathname.startsWith('/public/')) {
      return NextResponse.next()
    }

    // Check if user is authenticated (you'll implement this based on your auth)
    // For now, allow through
    return NextResponse.next()
  }

  // Validate subdomain exists
  if (!subdomain) {
    return NextResponse.next()
  }

  // School subdomain (schoolname.classpoint.com)
  // Rewrite to /school/[slug] routes
  const response = NextResponse.rewrite(
    new URL(`/school/${subdomain}${pathname}`, request.url)
  )

  // Add tenant slug to headers for access in components
  response.headers.set('x-tenant-slug', subdomain)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
