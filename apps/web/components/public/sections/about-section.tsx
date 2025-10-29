import type { Tenant } from '@/lib/types'

interface AboutSectionProps {
  tenant: Tenant
}

export function AboutSection({ tenant }: AboutSectionProps) {
  const stats = [
    {
      label: 'Years of Excellence',
      value: tenant.yearEstablished
        ? new Date().getFullYear() - tenant.yearEstablished
        : '50+',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Students Enrolled',
      value: tenant.studentCount || '1,000+',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Qualified Teachers',
      value: tenant.teacherCount || '100+',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Success Rate',
      value: tenant.successRate || '98%',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ]

  const features = [
    {
      title: 'Excellence in Education',
      description:
        'Our dedicated faculty and innovative curriculum ensure every student reaches their full potential.',
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: 'Modern Facilities',
      description:
        'State-of-the-art classrooms, laboratories, and sports facilities provide the best learning environment.',
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Extracurricular Activities',
      description:
        'A wide range of sports, arts, and clubs help students discover their passions and talents.',
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Global Perspective',
      description:
        'We prepare students for success in an interconnected world through international programs.',
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            About {tenant.schoolName}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {tenant.aboutText ||
              'We are committed to providing quality education that prepares students for success in a rapidly changing world.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-md text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-primary-600 flex justify-center mb-3">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-primary-600 mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-heading font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        {(tenant.mission || tenant.vision) && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {tenant.mission && (
              <div className="bg-primary-50 rounded-lg p-8">
                <h3 className="text-2xl font-heading font-bold text-primary-900 mb-4">
                  Our Mission
                </h3>
                <p className="text-primary-800">{tenant.mission}</p>
              </div>
            )}
            {tenant.vision && (
              <div className="bg-secondary-50 rounded-lg p-8">
                <h3 className="text-2xl font-heading font-bold text-secondary-900 mb-4">
                  Our Vision
                </h3>
                <p className="text-secondary-800">{tenant.vision}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
