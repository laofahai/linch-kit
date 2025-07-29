import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    edge: 'src/edge/index.ts',
    'server/index': 'src/server/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // DTS generation disabled due to tsconfig issues
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
    'next-auth/react',
    'react',
    'react/jsx-runtime',
  ],
})
