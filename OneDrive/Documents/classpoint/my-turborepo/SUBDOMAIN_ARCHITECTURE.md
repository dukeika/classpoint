# Multi-Tenant Subdomain Architecture

## Overview

ClassPoint uses a multi-tenant subdomain architecture where each school gets its own subdomain for their public-facing landing page. This architecture allows for:

- **Brand Isolation**: Each school has its own subdomain (e.g., `lincoln.classpoint.com`)
- **Custom Branding**: Schools can customize their landing pages with their own logo, colors, and content
- **Centralized Management**: All schools are managed from a single codebase and infrastructure
- **Scalability**: Easy to add new schools without infrastructure changes

## Domain Structure

```
classpoint.com                    → Main marketing site
app.classpoint.com                → Application portal (for authenticated users)
[schoolname].classpoint.com       → School-specific public landing pages
```

### Examples
- `lincoln.classpoint.com` → Lincoln High School's public site
- `riverside.classpoint.com` → Riverside Academy's public site
- `app.classpoint.com` → Authenticated portal for all users

## Architecture Components

### 1. Middleware (`middleware.ts`)

The middleware is the core of the subdomain routing system. It runs on every request and:

1. **Extracts the subdomain** from the request hostname
2. **Routes requests** based on the subdomain:
   - Main domain → Marketing site
   - `app`/`portal` subdomain → Application portal
   - School subdomain → School landing page
3. **Adds tenant context** via custom header (`x-tenant-slug`)

**File**: `apps/web/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = extractSubdomain(hostname)

  // Main domain
  if (isMainDomain(subdomain)) {
    return NextResponse.next()
  }

  // App portal
  if (isAppPortal(subdomain)) {
    return NextResponse.next()
  }

  // School subdomain - rewrite to /school/[slug]
  const response = NextResponse.rewrite(
    new URL(`/school/${subdomain}${pathname}`, request.url)
  )
  response.headers.set('x-tenant-slug', subdomain)
  return response
}
```

### 2. School Layout (`app/school/[slug]/layout.tsx`)

Server-side layout that:

1. **Fetches tenant data** by slug from the API
2. **Validates tenant** (exists and is active)
3. **Provides tenant context** to all child components
4. **Handles 404** for invalid/inactive tenants

**Key Features**:
- Server-side rendering for SEO
- Tenant data caching with `cache: 'no-store'`
- Automatic 404 handling
- Next.js 15 async params support

```typescript
export default async function SchoolLayout({ children, params }) {
  const resolvedParams = await params
  const tenant = await getTenantData(resolvedParams.slug)

  if (!tenant || !tenant.isActive) {
    notFound()
  }

  return <TenantProvider tenant={tenant}>{children}</TenantProvider>
}
```

### 3. Tenant Context (`lib/contexts/tenant-context.tsx`)

React Context that provides tenant data throughout the school site:

```typescript
export function useTenant() {
  const context = useContext(TenantContext)
  return context // { tenant, isLoading }
}
```

**Usage in Components**:
```typescript
function MyComponent() {
  const { tenant } = useTenant()
  return <h1>{tenant.schoolName}</h1>
}
```

### 4. School Landing Page (`app/school/[slug]/page.tsx`)

The main landing page for each school, composed of:
- Header (navigation, logo, portal link)
- Hero section (school name, tagline, CTA buttons)
- About section (stats, features, mission/vision)
- Contact section (contact form, office info)
- Footer (links, contact info, powered by ClassPoint)

All sections automatically adapt to the school's branding and data.

## Data Flow

### Request Flow
```
1. User visits: lincoln.classpoint.com
   ↓
2. Middleware extracts subdomain: "lincoln"
   ↓
3. Middleware rewrites to: /school/lincoln
   ↓
4. Layout fetches tenant data: GET /api/tenants/by-slug/lincoln
   ↓
5. Layout provides tenant context
   ↓
6. Page components render with tenant data
```

### Tenant Data Structure

```typescript
interface Tenant {
  id: string
  schoolName: string
  slug: string
  isActive: boolean

  // Contact info
  email?: string
  phone?: string
  address?: string
  website?: string

  // Branding
  logo?: string
  tagline?: string
  description?: string
  heroImage?: string

  // Content
  aboutText?: string
  mission?: string
  vision?: string

  // Stats
  yearEstablished?: number
  studentCount?: string
  teacherCount?: string
  successRate?: string

  // Subscription
  planId?: string
  currentEnrollment?: number
  studentCap?: number
}
```

## API Endpoints

### Required Backend Endpoints

1. **Get Tenant by Slug**
   ```
   GET /tenants/by-slug/:slug
   Response: Tenant object
   ```

2. **Get Tenant by ID** (for authenticated users)
   ```
   GET /tenants/:id
   Response: Tenant object
   ```

3. **List Tenants** (super admin only)
   ```
   GET /tenants
   Response: Tenant[]
   ```

## Components Structure

```
apps/web/
├── middleware.ts                          # Subdomain routing
├── app/
│   ├── (main)/                           # Main marketing site
│   ├── (app)/                            # Authenticated portal
│   └── school/
│       └── [slug]/                       # School sites
│           ├── layout.tsx                # Tenant data fetching
│           └── page.tsx                  # Landing page
├── components/
│   └── public/
│       ├── landing/                      # Layout components
│       │   ├── school-header.tsx
│       │   └── school-footer.tsx
│       └── sections/                     # Page sections
│           ├── hero-section.tsx
│           ├── about-section.tsx
│           └── contact-section.tsx
└── lib/
    ├── contexts/
    │   └── tenant-context.tsx            # Tenant context provider
    └── hooks/
        └── use-tenant.ts                 # Tenant data hooks
```

## Development Setup

### 1. Local Development with Subdomains

Add entries to your hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

```
127.0.0.1 localhost
127.0.0.1 app.localhost
127.0.0.1 lincoln.localhost
127.0.0.1 riverside.localhost
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ROOT_DOMAIN=classpoint.com
NODE_ENV=development
```

### 3. Test URLs

- Main site: http://localhost:3000
- App portal: http://app.localhost:3000
- School site: http://lincoln.localhost:3000

## Production Deployment

### DNS Configuration

1. **Root Domain** (classpoint.com)
   - A record → CloudFront/Load Balancer IP

2. **Wildcard Subdomain** (*.classpoint.com)
   - CNAME record → CloudFront distribution
   - Allows any subdomain to resolve

3. **App Subdomain** (app.classpoint.com)
   - CNAME record → Same CloudFront distribution

### SSL Certificates

Use AWS Certificate Manager (ACM) to create a wildcard certificate:
- Primary: `classpoint.com`
- SANs: `*.classpoint.com`, `app.classpoint.com`

### CloudFront Configuration

1. **Origin**: Next.js application on Vercel/EC2/ECS
2. **Alternate Domain Names**: `classpoint.com`, `*.classpoint.com`
3. **SSL Certificate**: ACM certificate
4. **Cache Behavior**:
   - School pages: Cache with revalidation
   - App portal: No cache
   - Static assets: Long cache

## Adding a New School

### Steps to Add a School

1. **Create Tenant in Database**
   ```typescript
   const tenant = await prisma.tenant.create({
     data: {
       schoolName: 'Lincoln High School',
       slug: 'lincoln', // Must be unique
       email: 'info@lincoln.edu',
       phone: '(555) 123-4567',
       isActive: true,
       // ... other fields
     }
   })
   ```

2. **School Site is Automatically Available**
   - No code changes needed
   - No deployment needed
   - Site available at: `lincoln.classpoint.com`

3. **Customize Branding**
   - Upload logo to S3
   - Set colors, tagline, description
   - Add mission, vision, about text

### Validation Rules

- **Slug**: Lowercase alphanumeric + hyphens only
- **Slug Length**: 3-50 characters
- **Unique**: Must be globally unique
- **Reserved**: Cannot use `app`, `www`, `api`, `admin`, `portal`

## SEO Considerations

### Metadata

Each school page should have unique metadata:

```typescript
// In school layout or page
export async function generateMetadata({ params }) {
  const tenant = await getTenantData(params.slug)

  return {
    title: `${tenant.schoolName} - Excellence in Education`,
    description: tenant.description,
    openGraph: {
      title: tenant.schoolName,
      description: tenant.description,
      images: [tenant.logo],
    },
  }
}
```

### Sitemap

Generate dynamic sitemap including all school pages:

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const tenants = await getAllActiveTenants()

  const schoolPages = tenants.map(tenant => ({
    url: `https://${tenant.slug}.classpoint.com`,
    lastModified: tenant.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...mainPages, ...schoolPages]
}
```

## Performance Optimization

### Caching Strategy

1. **Tenant Data**: Cache in Redis with 5-minute TTL
2. **Static Assets**: CDN cache with long TTL
3. **School Pages**: Incremental Static Regeneration (ISR)

### Edge Caching

Use Next.js Edge Runtime for middleware:
```typescript
export const config = {
  runtime: 'edge', // Run at the edge
  matcher: ['/((?!_next|static|favicon.ico).*)'],
}
```

## Security

### Considerations

1. **Tenant Isolation**: Each tenant's data is strictly isolated
2. **XSS Protection**: All tenant data is sanitized
3. **CORS**: Proper CORS headers for API requests
4. **Rate Limiting**: Per-subdomain rate limits
5. **CSP**: Content Security Policy headers

### Access Control

- **Public Pages**: No authentication required
- **Portal Pages**: Authentication required
- **Admin Pages**: Super admin role required

## Monitoring

### Metrics to Track

1. **Per-Tenant Metrics**:
   - Page views per school
   - Bounce rate per school
   - Conversion rate (portal signups)

2. **System Metrics**:
   - Middleware latency
   - Tenant data fetch time
   - Cache hit/miss rates

3. **Errors**:
   - 404s (invalid subdomains)
   - 500s (tenant data fetch failures)
   - Middleware errors

## Troubleshooting

### Common Issues

#### 1. School Site Returns 404

**Causes**:
- Tenant not in database
- Tenant `isActive` is false
- Slug mismatch

**Solution**: Check tenant record in database

#### 2. Subdomain Not Resolving

**Causes**:
- DNS not configured
- Wildcard DNS not working

**Solution**: Verify DNS records and propagation

#### 3. Middleware Not Running

**Causes**:
- Middleware matcher not matching route
- Middleware runtime error

**Solution**: Check middleware logs and matcher config

## Future Enhancements

### Planned Features

1. **Custom Domains**
   - Allow schools to use their own domains
   - Example: `www.lincolnhs.edu` → lincoln.classpoint.com

2. **Theme Customization**
   - Allow schools to customize colors, fonts
   - CSS variable overrides per tenant

3. **Page Builder**
   - Visual page builder for schools
   - Drag-and-drop sections

4. **Analytics Dashboard**
   - Per-school analytics
   - Visitor insights, engagement metrics

5. **Multi-Language Support**
   - i18n for school pages
   - Per-tenant language preferences

## Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Multi-Tenant Architecture Guide](https://vercel.com/guides/nextjs-multi-tenant-application)
- [Wildcard DNS Setup](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html)

## Support

For questions or issues related to the subdomain architecture:
1. Check this documentation
2. Review middleware and layout code
3. Check CloudWatch logs for errors
4. Contact DevOps team for DNS/infrastructure issues
