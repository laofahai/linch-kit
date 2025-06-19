import type { NextConfig } from "next";
import nextra from 'nextra'

const nextConfig: NextConfig = {
  /* config options here */
};

// Set up Nextra with its configuration
const withNextra = nextra({
  // ... Add Nextra-specific options here
})

// Export the final Next.js config with Nextra included
export default withNextra({
  // ... Add regular Next.js options here
})
