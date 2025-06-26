import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@linch-kit/core',
    '@linch-kit/schema', 
    '@linch-kit/auth'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        chokidar: false,
        cluster: false,
        worker_threads: false,
      }
    }
    return config
  },
}

export default nextConfig