import { defineConfig } from 'tsup'

export default defineConfig([
  // Main build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: {
      resolve: true,
    },
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'next'],
  },
  // Client build
  {
    entry: ['src/client.ts'],
    format: ['cjs', 'esm'],
    dts: {
      resolve: true,
    },
    outDir: 'dist',
    external: ['react', 'react-dom', 'next'],
    banner: {
      js: "'use client';",
    },
  },
  // Server build
  {
    entry: ['src/server.ts'],
    format: ['cjs', 'esm'],
    dts: {
      resolve: true,
    },
    outDir: 'dist',
    external: ['next'],
  },
  // Templates build
  {
    entry: ['src/templates.ts'],
    format: ['cjs', 'esm'],
    dts: {
      resolve: true,
    },
    outDir: 'dist',
  },
])