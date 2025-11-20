export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-heading font-bold text-primary-700">
          ClassPoint
        </h1>
        <p className="text-xl text-secondary-600 max-w-2xl">
          Modern School Management System
        </p>
        <p className="text-secondary-500">
          Frontend setup complete. Ready for development! 🚀
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Login
          </a>
          <a
            href="/signup"
            className="px-6 py-3 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}
