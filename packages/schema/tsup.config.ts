import { createCliConfig } from '../../configs/tsup.base'

export default createCliConfig({
  entry: {
    index: 'src/index.ts',
    generators: 'src/generators.ts',
    'cli/index': 'src/cli/index.ts',
    'plugins/cli-plugin': 'src/plugins/cli-plugin.ts',
  }
})
