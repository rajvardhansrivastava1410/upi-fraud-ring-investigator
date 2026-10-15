import type { NextConfig } from 'next';

const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

const nextConfig: NextConfig = {
  async rewrites() {
    if (DEMO) return [];
    // Route handlers (e.g. /api/mock/*) are matched before these rewrites.
    return [{ source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' }];
  },
};

export default nextConfig;
