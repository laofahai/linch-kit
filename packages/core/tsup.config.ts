import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    'cli/index': 'src/cli/index.ts',
    'config/index': 'src/config/index.ts',
    'utils/index': 'src/utils/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  // CLI 需要可执行权限
  onSuccess: async () => {
    const { chmodSync } = await import('fs')
    try {
      chmodSync('dist/cli.js', '755')
    } catch (error) {
      // 忽略权限设置错误
    }
  }
})
