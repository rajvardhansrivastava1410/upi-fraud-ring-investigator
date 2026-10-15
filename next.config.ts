import type { NextConfig } from 'next';

const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';
const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  async rewrites() {
    if (DEMO) return [];
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/geo/:path*', destination: `${backendUrl}/geo/:path*` },
      { source: '/train/:path*', destination: `${backendUrl}/train/:path*` },
    ];
  },
};

export default nextConfig;
