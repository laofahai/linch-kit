import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/types/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@linch-kit/core': path.resolve(__dirname, '../core/src'),
      '@linch-kit/schema': path.resolve(__dirname, '../schema/src')
    }
  }
})