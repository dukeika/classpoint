import { LoginForm } from '@/components/auth/login-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <LoginForm />
      </div>

      {/* Right side - Branding/Image */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold">ClassPoint</h2>
            <p className="text-xl text-blue-100">School Management System</p>
          </div>
          <p className="text-lg text-blue-50">
            Streamline your school operations with our comprehensive platform for student management,
            attendance tracking, assessments, and more.
          </p>
          <div className="space-y-3 pt-6">
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-blue-50">Manage students, classes, and enrollments</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-blue-50">Track attendance and academic performance</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-blue-50">Generate comprehensive reports and analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
