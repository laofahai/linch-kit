import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  shims: true, // 为 CLI 添加 shims
  esbuildOptions: options => {
    // 确保所有文件都被包含在构建中
    options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx']
  },
  // 使用专门为构建创建的 tsconfig.build.json
  tsconfig: './tsconfig.build.json',
})
