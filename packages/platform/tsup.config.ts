import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', '@linch-kit/core'],
  },
  {
    entry: ['src/trpc/index.ts'],
    outDir: 'dist',
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react-dom', '@linch-kit/core'],
  },
  {
    entry: ['src/validation/index.ts'],
    outDir: 'dist',
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react-dom', '@linch-kit/core'],
  },
])
