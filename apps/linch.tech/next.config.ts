import type { NextConfig } from "next";
import nextra from 'nextra'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/github',
        destination: 'https://github.com/laofahai/linch-kit',
        permanent: false,
      },
    ]
  },
};

// Set up Nextra with its configuration
const withNextra = nextra({
  search: {
    codeblocks: true // Enable code block indexing
  },
  mdxOptions: {}
})

// Export the final Next.js config with Nextra included
export default withNextra(nextConfig)
