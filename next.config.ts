
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // optimizePackageImports can be removed or kept empty if no specific packages need optimization
    // optimizePackageImports: [], 
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        sys: false,
        fs: false,
        path: false,
        util: false,
      };
    }
    return config;
  },
};

export default nextConfig;
