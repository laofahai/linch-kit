#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

/**
 * 批量更新所有包的配置文件
 */

class ConfigUpdater {
  constructor() {
    this.packagesDir = path.join(process.cwd(), 'packages')
    this.configsDir = path.join(process.cwd(), 'configs')
  }

  /**
   * 获取所有包
   */
  async getPackages() {
    const packagePaths = await glob('packages/*/package.json')
    return packagePaths.map(packagePath => {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
      const packageDir = path.dirname(packagePath)
      
      return {
        name: packageJson.name,
        path: packageDir,
        packageJson,
        packageJsonPath: packagePath
      }
    })
  }

  /**
   * 检查包是否有 CLI 功能
   */
  isCLIPackage(packagePath) {
    const srcPath = path.join(packagePath, 'src')
    const hasCliDir = fs.existsSync(path.join(srcPath, 'cli'))
    const hasCliFile = fs.existsSync(path.join(srcPath, 'cli.ts'))
    const hasBinField = fs.existsSync(path.join(packagePath, 'package.json')) && 
      JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf-8')).bin
    
    return hasCliDir || hasCliFile || hasBinField
  }

  /**
   * 检查包是否是 React 组件库
   */
  isReactPackage(packagePath) {
    const packageJsonPath = path.join(packagePath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return false
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const deps = { ...packageJson.dependencies, ...packageJson.peerDependencies }
    
    return 'react' in deps || 'react-dom' in deps || packageJson.name.includes('ui')
  }

  /**
   * 更新 tsconfig.json
   */
  updateTsConfig(packagePath) {
    const tsconfigPath = path.join(packagePath, 'tsconfig.json')
    const isReact = this.isReactPackage(packagePath)
    
    const config = {
      "extends": "../../configs/tsconfig.base.json",
      "compilerOptions": {
        "tsBuildInfoFile": ".tsbuildinfo"
      }
    }

    // React 包需要 JSX 配置
    if (isReact) {
      config.compilerOptions.jsx = "react-jsx"
      config.compilerOptions.lib = ["es2022", "dom"]
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + '\n')
    console.log(`✅ 更新 ${path.basename(packagePath)}/tsconfig.json`)
  }

  /**
   * 更新 tsconfig.build.json
   */
  updateTsBuildConfig(packagePath) {
    const tsBuildConfigPath = path.join(packagePath, 'tsconfig.build.json')
    
    const config = {
      "extends": "../../configs/tsconfig.build.json"
    }

    fs.writeFileSync(tsBuildConfigPath, JSON.stringify(config, null, 2) + '\n')
    console.log(`✅ 更新 ${path.basename(packagePath)}/tsconfig.build.json`)
  }

  /**
   * 更新 tsup.config.ts
   */
  updateTsupConfig(packagePath, packageName) {
    const tsupConfigPath = path.join(packagePath, 'tsup.config.ts')
    const isCLI = this.isCLIPackage(packagePath)
    const isReact = this.isReactPackage(packagePath)
    
    let content = ''
    
    if (isCLI) {
      content = `import { createCliConfig } from '../../configs/tsup.base'

export default createCliConfig({
  entry: ['src/index.ts']
})
`
    } else if (isReact) {
      content = `import { createReactConfig } from '../../configs/tsup.base'

export default createReactConfig({
  entry: ['src/index.ts']
})
`
    } else {
      content = `import { createLibraryConfig } from '../../configs/tsup.base'

export default createLibraryConfig({
  entry: ['src/index.ts']
})
`
    }

    fs.writeFileSync(tsupConfigPath, content)
    console.log(`✅ 更新 ${path.basename(packagePath)}/tsup.config.ts (${isCLI ? 'CLI' : isReact ? 'React' : 'Library'})`)
  }

  /**
   * 更新包的 scripts
   */
  updatePackageScripts(pkg) {
    const { packageJson, packageJsonPath } = pkg
    
    // 标准化 scripts
    const standardScripts = {
      "build": "tsup",
      "build:watch": "tsup --watch",
      "dev": "tsup --watch",
      "test": "vitest",
      "test:watch": "vitest --watch",
      "lint": "eslint src --ext .ts,.tsx",
      "lint:fix": "eslint src --ext .ts,.tsx --fix",
      "check-types": "tsc --noEmit",
      "clean": "rm -rf dist .turbo node_modules/.cache"
    }

    // 合并现有 scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      ...standardScripts
    }

    // 确保正确的 exports 字段
    if (!packageJson.exports) {
      packageJson.exports = {
        ".": {
          "import": "./dist/index.mjs",
          "require": "./dist/index.js",
          "types": "./dist/index.d.ts"
        }
      }
    }

    // 确保正确的 files 字段
    if (!packageJson.files || !packageJson.files.includes('dist')) {
      packageJson.files = ['dist', 'README.md']
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    console.log(`✅ 更新 ${pkg.name}/package.json scripts`)
  }

  /**
   * 创建缺失的配置文件
   */
  createMissingConfigs(packagePath) {
    const configs = [
      'tsconfig.json',
      'tsconfig.build.json', 
      'tsup.config.ts'
    ]

    configs.forEach(config => {
      const configPath = path.join(packagePath, config)
      if (!fs.existsSync(configPath)) {
        console.log(`📝 创建缺失的配置文件: ${path.basename(packagePath)}/${config}`)
        
        switch (config) {
          case 'tsconfig.json':
            this.updateTsConfig(packagePath)
            break
          case 'tsconfig.build.json':
            this.updateTsBuildConfig(packagePath)
            break
          case 'tsup.config.ts':
            this.updateTsupConfig(packagePath, path.basename(packagePath))
            break
        }
      }
    })
  }

  /**
   * 验证配置
   */
  validateConfigs(packages) {
    console.log('\n🔍 验证配置...')
    
    let hasErrors = false
    
    packages.forEach(pkg => {
      const requiredFiles = [
        'tsconfig.json',
        'tsconfig.build.json',
        'tsup.config.ts',
        'src/index.ts'
      ]

      requiredFiles.forEach(file => {
        const filePath = path.join(pkg.path, file)
        if (!fs.existsSync(filePath)) {
          console.error(`❌ 缺失文件: ${pkg.name}/${file}`)
          hasErrors = true
        }
      })
    })

    if (!hasErrors) {
      console.log('✅ 所有配置文件验证通过')
    }

    return !hasErrors
  }

  /**
   * 主更新流程
   */
  async updateAll() {
    try {
      console.log('🔄 开始批量更新配置文件...\n')

      const packages = await this.getPackages()
      console.log(`📦 找到 ${packages.length} 个包`)

      for (const pkg of packages) {
        console.log(`\n📝 处理 ${pkg.name}...`)
        
        // 创建缺失的配置文件
        this.createMissingConfigs(pkg.path)
        
        // 更新配置文件
        this.updateTsConfig(pkg.path)
        this.updateTsBuildConfig(pkg.path)
        this.updateTsupConfig(pkg.path, pkg.name)
        
        // 更新 package.json
        this.updatePackageScripts(pkg)
      }

      // 验证配置
      const isValid = this.validateConfigs(packages)
      
      if (isValid) {
        console.log('\n🎉 所有配置文件更新完成!')
        console.log('\n下一步:')
        console.log('1. 运行 pnpm install 更新依赖')
        console.log('2. 运行 pnpm build:packages 测试构建')
        console.log('3. 运行 pnpm check-types 检查类型')
      } else {
        console.log('\n⚠️ 配置更新完成，但存在一些问题，请检查上述错误')
      }

    } catch (error) {
      console.error('❌ 更新配置失败:', error.message)
      process.exit(1)
    }
  }
}

// 运行更新
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new ConfigUpdater()
  updater.updateAll()
}

export { ConfigUpdater }
