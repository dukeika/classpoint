/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: ".next",
  output: "standalone",
  images: {
    unoptimized: true
  },
  experimental: {
    webpackBuildWorker: false,
    workerThreads: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
