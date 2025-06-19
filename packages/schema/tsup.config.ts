import { createCliConfig } from '../../configs/tsup.base'

export default createCliConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  }
})
