import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/common.ts',
    'src/extension.ts',
    'src/platform.ts',
    'src/auth.ts',
    'src/ui.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2020',
  external: ['react', 'react-dom'],
})