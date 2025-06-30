import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2022',
  external: [
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/trpc',
    'next-auth',
    'next-auth/react'
  ]
})