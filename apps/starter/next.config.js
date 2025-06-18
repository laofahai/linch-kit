/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_AUTH_STRATEGY: process.env.NEXT_PUBLIC_AUTH_STRATEGY,
  },
}

export default nextConfig
