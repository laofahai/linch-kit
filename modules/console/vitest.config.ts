import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
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
      '@linch-kit/schema': path.resolve(__dirname, '../schema/src'),
      '@linch-kit/auth': path.resolve(__dirname, '../auth/src'),
      '@linch-kit/crud': path.resolve(__dirname, '../crud/src'),
      '@linch-kit/trpc': path.resolve(__dirname, '../trpc/src'),
      '@linch-kit/ui': path.resolve(__dirname, '../ui/src'),
    }
  }
});
