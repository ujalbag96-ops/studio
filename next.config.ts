import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Required for Capacitor/Mobile builds
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static Capacitor export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
