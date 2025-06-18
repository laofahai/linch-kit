import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'schemas/index': 'src/schemas/index.ts',
    'config/index': 'src/config/index.ts',
    'cli/index': 'src/cli/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['next', 'next-auth', 'react', 'react-dom'],
  // CLI 需要可执行权限
  onSuccess: async () => {
    const { chmodSync } = await import('fs')
    try {
      chmodSync('dist/cli/index.js', '755')
    } catch (error) {
      // 忽略权限设置错误
    }
  }
})
