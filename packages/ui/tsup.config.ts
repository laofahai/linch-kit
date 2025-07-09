import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

export default defineConfig({
  entry: ['src/client.ts', 'src/server.ts', 'src/shared.ts'],
  format: ['esm'], // Next.js App Router 推荐使用 ESM
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@hookform/resolvers',
    '@linch-kit/core',
    '@linch-kit/crud',
    '@linch-kit/schema',
    'react-hook-form',
  ],
  treeshake: true,
  minify: false,
  target: 'es2020',
  // 确保 ESM 输出格式正确
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    }
  },
  // 复制CSS文件到dist目录
  onSuccess: async () => {
    const stylesDir = 'dist/styles'
    mkdirSync(stylesDir, { recursive: true })
    copyFileSync('src/styles/globals.css', 'dist/styles/globals.css')
    console.log('CSS files copied to dist/styles/')
  },
})
