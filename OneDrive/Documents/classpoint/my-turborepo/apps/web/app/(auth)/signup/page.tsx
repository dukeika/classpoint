import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <SignupForm />
      </div>

      {/* Right side - Branding/Image */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-green-600 to-green-800 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold">Join ClassPoint</h2>
            <p className="text-xl text-green-100">Create your account</p>
          </div>
          <p className="text-lg text-green-50">
            Get started with our comprehensive school management platform and streamline
            your educational operations.
          </p>
          <div className="space-y-3 pt-6">
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-green-300 flex-shrink-0"
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
              <p className="text-green-50">Complete student and class management</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-green-300 flex-shrink-0"
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
              <p className="text-green-50">Real-time attendance and grading</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-green-300 flex-shrink-0"
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
              <p className="text-green-50">Advanced analytics and reporting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
