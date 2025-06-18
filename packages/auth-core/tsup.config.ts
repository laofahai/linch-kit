import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'schemas/index': 'src/schemas/index.ts',
    'config/index': 'src/config/index.ts',
    'plugins/cli-plugin': 'src/plugins/cli-plugin.ts',
    'plugins/config-plugin': 'src/plugins/config-plugin.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['next', 'next-auth', 'react', 'react-dom', '@linch-kit/core']
})
