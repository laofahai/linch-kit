import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  clean: true,
  sourcemap: true,
  dts: true,
  target: 'es2022',
  external: ['@linch-kit/schema', '@linch-kit/auth'],
  treeshake: true,
  splitting: false,
  minify: false,
  tsconfig: './tsconfig.build.json',
})
