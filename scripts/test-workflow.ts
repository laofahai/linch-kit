#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * 测试完整的 monorepo 工作流
 */

class WorkflowTester {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  /**
   * 执行命令
   */
  exec(command, options = {}) {
    console.log(`🔄 执行: ${command}`)
    try {
      const result = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf-8',
        ...options
      })
      console.log(`✅ 成功`)
      return result
    } catch (error) {
      console.error(`❌ 失败: ${error.message}`)
      this.errors.push(`命令失败: ${command} - ${error.message}`)
      throw error
    }
  }

  /**
   * 安全执行命令（不抛出错误）
   */
  safeExec(command, options = {}) {
    try {
      return this.exec(command, options)
    } catch (error) {
      this.warnings.push(`命令警告: ${command} - ${error.message}`)
      return null
    }
  }

  /**
   * 检查文件是否存在
   */
  checkFile(filePath, description) {
    if (existsSync(filePath)) {
      console.log(`✅ ${description}: ${filePath}`)
      return true
    } else {
      console.error(`❌ 缺失 ${description}: ${filePath}`)
      this.errors.push(`缺失文件: ${filePath}`)
      return false
    }
  }

  /**
   * 1. 检查环境
   */
  checkEnvironment() {
    console.log('\n📋 1. 检查环境...')

    // 检查 Node.js 版本
    const nodeVersion = this.exec('node --version').trim()
    console.log(`Node.js 版本: ${nodeVersion}`)

    // 检查 pnpm 版本
    const pnpmVersion = this.exec('pnpm --version').trim()
    console.log(`pnpm 版本: ${pnpmVersion}`)

    // 检查 turbo 版本
    const turboVersion = this.safeExec('pnpm turbo --version')
    if (turboVersion) {
      console.log(`Turbo 版本: ${turboVersion.trim()}`)
    }
  }

  /**
   * 2. 检查配置文件
   */
  checkConfigurations() {
    console.log('\n📋 2. 检查配置文件...')

    const requiredFiles = [
      'package.json',
      'pnpm-workspace.yaml',
      'turbo.json',
      'configs/tsconfig.base.json',
      'configs/tsconfig.build.json',
      'configs/tsup.base.ts'
    ]

    requiredFiles.forEach(file => {
      this.checkFile(file, '配置文件')
    })
  }

  /**
   * 3. 检查包结构
   */
  checkPackages() {
    console.log('\n📋 3. 检查包结构...')

    const packages = [
      'packages/core',
      'packages/types',
      'packages/auth-core',
      'packages/schema',
      'packages/trpc',
      'packages/crud',
      'packages/ui'
    ]

    packages.forEach(pkg => {
      console.log(`\n检查包: ${pkg}`)

      const requiredFiles = [
        `${pkg}/package.json`,
        `${pkg}/tsconfig.json`,
        `${pkg}/tsconfig.build.json`,
        `${pkg}/tsup.config.ts`,
        `${pkg}/src/index.ts`
      ]

      requiredFiles.forEach(file => {
        this.checkFile(file, '包文件')
      })
    })
  }

  /**
   * 4. 安装依赖
   */
  installDependencies() {
    console.log('\n📋 4. 安装依赖...')
    this.exec('pnpm install')
  }

  /**
   * 5. 构建包
   */
  buildPackages() {
    console.log('\n📋 5. 构建包...')
    this.exec('pnpm build:packages')
  }

  /**
   * 6. 类型检查
   */
  typeCheck() {
    console.log('\n📋 6. 类型检查...')
    this.exec('pnpm check-types')
  }

  /**
   * 7. 代码检查
   */
  lint() {
    console.log('\n📋 7. 代码检查...')
    this.safeExec('pnpm lint')
  }

  /**
   * 8. 运行测试
   */
  runTests() {
    console.log('\n📋 8. 运行测试...')
    this.safeExec('pnpm test')
  }

  /**
   * 9. 依赖图分析
   */
  analyzeDependencies() {
    console.log('\n📋 9. 依赖图分析...')
    this.exec('node scripts/deps-graph.js')
  }

  /**
   * 10. 测试发布流程（dry run）
   */
  async testRelease() {
    console.log('\n📋 10. 测试发布流程...')

    // 备份当前状态
    console.log('📦 备份当前 package.json 文件...')
    const { glob } = await import('glob')
    const packagePaths = glob.sync('packages/*/package.json')
    const backups = new Map()

    packagePaths.forEach(path => {
      const content = readFileSync(path, 'utf-8')
      backups.set(path, content)
    })

    try {
      // 模拟版本更新
      console.log('🔄 模拟版本更新...')
      packagePaths.forEach(path => {
        const packageJson = JSON.parse(readFileSync(path, 'utf-8'))
        const currentVersion = packageJson.version
        const parts = currentVersion.split('.')
        parts[2] = (parseInt(parts[2]) + 1).toString()
        packageJson.version = parts.join('.')

        writeFileSync(path, JSON.stringify(packageJson, null, 2) + '\n')
        console.log(`  📝 ${packageJson.name}: ${currentVersion} → ${packageJson.version}`)
      })

      // 测试依赖替换
      console.log('🔄 测试依赖替换...')
      const { ReleaseManager } = await import('./release.js')
      const releaseManager = new ReleaseManager()

      // 只测试依赖替换，不实际发布
      const packages = packagePaths.map(path => {
        const packageJson = JSON.parse(readFileSync(path, 'utf-8'))
        return {
          path: path.replace('/package.json', ''),
          name: packageJson.name,
          version: packageJson.version,
          packageJson,
          packageJsonPath: path
        }
      })

      releaseManager.backupPackageJsons(packages)
      releaseManager.replaceWorkspaceDependencies(packages)

      console.log('✅ 依赖替换测试成功')

    } finally {
      // 恢复备份
      console.log('🔄 恢复备份文件...')
      backups.forEach((content, path) => {
        writeFileSync(path, content)
      })
      console.log('✅ 备份已恢复')
    }
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📊 测试报告')
    console.log('='.repeat(50))

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 所有测试通过！')
      console.log('\n✅ 工作流状态: 健康')
      console.log('✅ 可以安全地进行开发和发布')
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ 错误:')
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`)
        })
      }

      if (this.warnings.length > 0) {
        console.log('\n⚠️ 警告:')
        this.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`)
        })
      }

      console.log(`\n📊 总计: ${this.errors.length} 个错误, ${this.warnings.length} 个警告`)

      if (this.errors.length > 0) {
        console.log('\n🔧 建议修复错误后重新运行测试')
        process.exit(1)
      }
    }
  }

  /**
   * 运行完整测试
   */
  async runFullTest() {
    console.log('🚀 开始 Monorepo 工作流测试...\n')

    try {
      this.checkEnvironment()
      this.checkConfigurations()
      this.checkPackages()
      this.installDependencies()
      this.buildPackages()
      this.typeCheck()
      this.lint()
      this.runTests()
      this.analyzeDependencies()
      await this.testRelease()

    } catch (error) {
      console.error('\n💥 测试过程中发生严重错误:', error.message)
      this.errors.push(`严重错误: ${error.message}`)
    }

    this.generateReport()
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WorkflowTester()
  tester.runFullTest()
}

export { WorkflowTester }
