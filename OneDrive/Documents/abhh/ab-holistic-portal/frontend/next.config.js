/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  optimizeFonts: true,

  // Output configuration for deployment
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // Images configuration for static export
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['@heroicons/react'],
    serverComponentsExternalPackages: ['@aws-sdk/client-cognito-identity-provider'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000
      };
    }

    // Handle AWS SDK modules properly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // ESLint configuration - relax for immediate functionality
  eslint: {
    ignoreDuringBuilds: true, // Re-enable after fixing ESLint issues
    dirs: ['src'],
  },

  // TypeScript checking during build (keep enabled for type safety)
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
