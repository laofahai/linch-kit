import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LinchKit - AI-First Full-Stack Development Framework',
    short_name: 'LinchKit',
    description: 'Enterprise-ready development framework with Schema-driven architecture and end-to-end type safety, designed for AI era.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['developer', 'productivity', 'utilities'],
    lang: 'en',
    orientation: 'portrait-primary',
    scope: '/',
    id: 'linchkit-docs',
  }
}