import { createLibraryConfig } from '../../configs/tsup.base'

export default createLibraryConfig({
  entry: ['src/index.ts', 'src/cli.ts']
})
