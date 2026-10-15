/** @type {import('next').NextConfig} */
const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/geo/:path*',
        destination: `${backendUrl}/geo/:path*`,
      },
      {
        source: '/train/:path*',
        destination: `${backendUrl}/train/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
