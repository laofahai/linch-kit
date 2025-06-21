#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const packagesDir = path.join(__dirname, '../packages')
const packages = fs.readdirSync(packagesDir).filter(dir => {
  const packagePath = path.join(packagesDir, dir)
  return fs.statSync(packagePath).isDirectory() && 
         fs.existsSync(path.join(packagePath, 'package.json'))
})

console.log('Found packages:', packages)

// 标准 tsconfig.json 内容
const standardTsConfig = {
  "extends": "../../configs/tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}

// 标准 tsconfig.build.json 内容
const standardTsBuildConfig = {
  "extends": "../../configs/tsconfig.build.json"
}

// 更新每个包的配置
packages.forEach(pkg => {
  const packagePath = path.join(packagesDir, pkg)
  
  // 更新 tsconfig.json
  const tsconfigPath = path.join(packagePath, 'tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    fs.writeFileSync(tsconfigPath, JSON.stringify(standardTsConfig, null, 2) + '\n')
    console.log(`Updated ${pkg}/tsconfig.json`)
  }
  
  // 更新 tsconfig.build.json
  const tsBuildConfigPath = path.join(packagePath, 'tsconfig.build.json')
  if (fs.existsSync(tsBuildConfigPath)) {
    fs.writeFileSync(tsBuildConfigPath, JSON.stringify(standardTsBuildConfig, null, 2) + '\n')
    console.log(`Updated ${pkg}/tsconfig.build.json`)
  }
  
  // 检查是否有 CLI 功能
  const srcPath = path.join(packagePath, 'src')
  const hasCliDir = fs.existsSync(path.join(srcPath, 'cli'))
  const hasCliFile = fs.existsSync(path.join(srcPath, 'cli.ts'))
  const isCli = hasCliDir || hasCliFile
  
  // 更新 tsup.config.ts
  const tsupConfigPath = path.join(packagePath, 'tsup.config.ts')
  if (fs.existsSync(tsupConfigPath)) {
    let tsupContent
    if (isCli) {
      tsupContent = `import { createCliConfig } from '../../configs/tsup.base'

export default createCliConfig({
  entry: ['src/index.ts']
})
`
    } else {
      tsupContent = `import { createLibraryConfig } from '../../configs/tsup.base'

export default createLibraryConfig({
  entry: ['src/index.ts']
})
`
    }
    
    fs.writeFileSync(tsupConfigPath, tsupContent)
    console.log(`Updated ${pkg}/tsup.config.ts (${isCli ? 'CLI' : 'Library'})`)
  }
})

console.log('Configuration update completed!')
