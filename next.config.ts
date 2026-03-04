import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // All Firebase calls happen client-side (browser → Firestore)
  // No server-side rendering needed for data
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
