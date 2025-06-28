import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/index.ts',
    'src/forms/index.ts',
    'src/tables/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom'
  ],
  treeshake: true,
  minify: false,
  target: 'es2020'
})