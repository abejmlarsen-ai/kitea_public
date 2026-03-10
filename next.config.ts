import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Image optimisation — external hostnames for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hwfxwbdnsnlvnyhkstcj.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
}

export default nextConfig
