import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  // CLI 需要可执行权限
  onSuccess: async () => {
    const { chmodSync } = await import('fs')
    try {
      chmodSync('dist/index.js', '755')
    } catch (error) {
      // 忽略权限设置错误
    }
  }
})
