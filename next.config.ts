import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  // Environment variables can be defined here or in .env.local
  // For client-side accessible variables, prefix with NEXT_PUBLIC_
  // env: {
  //   API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api',
  // },
};

export default nextConfig;
