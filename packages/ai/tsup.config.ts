import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/extractors/index.ts',
    'src/graph/index.ts',
    'src/tools/index.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: ['neo4j-driver'],
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
})