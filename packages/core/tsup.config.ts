import { createCliConfig } from '../../configs/tsup.base'

export default createCliConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    'cli/index': 'src/cli/index.ts',
    'config/index': 'src/config/index.ts',
    'utils/index': 'src/utils/index.ts'
  }
})
