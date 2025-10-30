/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static HTML export for Amplify WEB hosting
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable features not supported in static export
  trailingSlash: true,
};

export default nextConfig;
