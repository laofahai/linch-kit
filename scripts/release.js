#!/usr/bin/env node

const { execSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const { glob } = require('glob')

/**
 * 发布脚本
 * 
 * 功能：
 * 1. 构建所有包
 * 2. 运行测试
 * 3. 更新版本号
 * 4. 替换 workspace:* 依赖
 * 5. 发布到 npm
 * 6. 恢复 workspace:* 依赖
 */

class ReleaseManager {
  constructor() {
    this.packagesDir = join(process.cwd(), 'packages')
    this.originalPackageJsons = new Map()
  }

  /**
   * 执行命令
   */
  exec(command, options = {}) {
    console.log(`🔄 执行: ${command}`)
    try {
      return execSync(command, { 
        stdio: 'inherit', 
        encoding: 'utf-8',
        ...options 
      })
    } catch (error) {
      console.error(`❌ 命令执行失败: ${command}`)
      throw error
    }
  }

  /**
   * 获取所有包的信息
   */
  async getPackages() {
    const packagePaths = await glob('packages/*/package.json')
    return packagePaths.map(path => {
      const packageJson = JSON.parse(readFileSync(path, 'utf-8'))
      return {
        path: path.replace('/package.json', ''),
        name: packageJson.name,
        version: packageJson.version,
        packageJson,
        packageJsonPath: path
      }
    })
  }

  /**
   * 备份原始 package.json
   */
  backupPackageJsons(packages) {
    packages.forEach(pkg => {
      this.originalPackageJsons.set(pkg.name, { ...pkg.packageJson })
    })
  }

  /**
   * 替换 workspace:* 依赖为具体版本
   */
  replaceWorkspaceDependencies(packages) {
    const packageVersionMap = new Map()
    packages.forEach(pkg => {
      packageVersionMap.set(pkg.name, pkg.version)
    })

    packages.forEach(pkg => {
      let modified = false
      const { packageJson } = pkg

      // 处理所有类型的依赖
      const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

      dependencyTypes.forEach(depType => {
        if (packageJson[depType]) {
          Object.keys(packageJson[depType]).forEach(depName => {
            const currentVersion = packageJson[depType][depName]

            // 处理各种 workspace 格式
            if (currentVersion === 'workspace:*' ||
                currentVersion === 'workspace:^' ||
                currentVersion === 'workspace:~' ||
                currentVersion.startsWith('workspace:')) {

              if (packageVersionMap.has(depName)) {
                // 根据原始格式决定版本前缀
                let versionPrefix = '^'
                if (currentVersion === 'workspace:~') {
                  versionPrefix = '~'
                } else if (currentVersion.match(/^workspace:\d/)) {
                  versionPrefix = '' // 精确版本
                }

                packageJson[depType][depName] = `${versionPrefix}${packageVersionMap.get(depName)}`
                modified = true
                console.log(`  📝 ${depName}: ${currentVersion} → ${packageJson[depType][depName]}`)
              } else {
                console.warn(`⚠️ 警告: 找不到包 ${depName} 的版本信息`)
              }
            }
          })
        }
      })

      if (modified) {
        writeFileSync(pkg.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
        console.log(`✅ 已更新 ${pkg.name} 的依赖版本`)
      }
    })
  }

  /**
   * 恢复原始 package.json
   */
  restorePackageJsons(packages) {
    packages.forEach(pkg => {
      const original = this.originalPackageJsons.get(pkg.name)
      if (original) {
        writeFileSync(pkg.packageJsonPath, JSON.stringify(original, null, 2) + '\n')
      }
    })
    console.log('✅ 已恢复原始 package.json 文件')
  }

  /**
   * 发布包
   */
  publishPackages(packages) {
    packages.forEach(pkg => {
      try {
        console.log(`📦 发布 ${pkg.name}@${pkg.version}`)
        this.exec(`npm publish --access public`, { cwd: pkg.path })
        console.log(`✅ ${pkg.name} 发布成功`)
      } catch (error) {
        console.error(`❌ ${pkg.name} 发布失败:`, error.message)
        throw error
      }
    })
  }

  /**
   * 主发布流程
   */
  async release() {
    try {
      console.log('🚀 开始发布流程...')

      // 1. 构建和测试
      console.log('\n📦 构建所有包...')
      this.exec('pnpm turbo build')

      console.log('\n🧪 运行测试...')
      this.exec('pnpm turbo test')

      console.log('\n🔍 类型检查...')
      this.exec('pnpm turbo check-types')

      console.log('\n🎨 代码检查...')
      this.exec('pnpm turbo lint')

      // 2. 获取包信息
      const packages = await this.getPackages()
      console.log(`\n📋 找到 ${packages.length} 个包`)

      // 3. 备份原始 package.json
      this.backupPackageJsons(packages)

      // 4. 替换 workspace 依赖
      console.log('\n🔄 替换 workspace:* 依赖...')
      this.replaceWorkspaceDependencies(packages)

      // 5. 发布包
      console.log('\n📤 发布包到 npm...')
      this.publishPackages(packages)

      // 6. 恢复原始 package.json
      this.restorePackageJsons(packages)

      console.log('\n🎉 发布完成!')

    } catch (error) {
      console.error('\n❌ 发布失败:', error.message)
      
      // 确保恢复原始文件
      try {
        const packages = await this.getPackages()
        this.restorePackageJsons(packages)
      } catch (restoreError) {
        console.error('❌ 恢复文件失败:', restoreError.message)
      }
      
      process.exit(1)
    }
  }
}

// 运行发布
if (require.main === module) {
  const releaseManager = new ReleaseManager()
  releaseManager.release()
}

module.exports = { ReleaseManager }
