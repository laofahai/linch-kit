#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')
const { glob } = require('glob')
const chokidar = require('chokidar')

/**
 * 开发工具集
 * 
 * 功能：
 * 1. 监听文件变化，自动重新构建
 * 2. 多包联调支持
 * 3. 依赖同步
 * 4. 开发环境配置
 */

class DevTools {
  constructor() {
    this.watchers = new Map()
    this.buildQueue = new Set()
    this.isBuilding = false
    this.buildTimeout = null
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
   * 异步执行命令
   */
  spawn(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        ...options
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed with exit code ${code}`))
        }
      })

      child.on('error', reject)
    })
  }

  /**
   * 获取包信息
   */
  async getPackages() {
    const packagePaths = await glob('packages/*/package.json')
    return packagePaths.map(path => {
      const packageJson = JSON.parse(readFileSync(path, 'utf-8'))
      return {
        path: path.replace('/package.json', ''),
        name: packageJson.name,
        packageJson
      }
    })
  }

  /**
   * 构建单个包
   */
  async buildPackage(packagePath) {
    try {
      console.log(`🔨 构建 ${packagePath}`)
      await this.spawn('pnpm', ['turbo', 'build:packages', `--filter=${packagePath}`])
      console.log(`✅ ${packagePath} 构建完成`)
    } catch (error) {
      console.error(`❌ ${packagePath} 构建失败:`, error.message)
    }
  }

  /**
   * 批量构建
   */
  async batchBuild() {
    if (this.isBuilding || this.buildQueue.size === 0) {
      return
    }

    this.isBuilding = true
    const packages = Array.from(this.buildQueue)
    this.buildQueue.clear()

    console.log(`🔨 批量构建: ${packages.join(', ')}`)

    try {
      // 使用 turbo 的依赖图自动排序构建
      const filter = packages.map(pkg => `--filter=${pkg}`).join(' ')
      await this.spawn('pnpm', ['turbo', 'build:packages', ...filter.split(' ')])
      console.log('✅ 批量构建完成')
    } catch (error) {
      console.error('❌ 批量构建失败:', error.message)
    } finally {
      this.isBuilding = false
    }
  }

  /**
   * 延迟构建
   */
  debouncedBuild(packagePath) {
    this.buildQueue.add(packagePath)
    
    if (this.buildTimeout) {
      clearTimeout(this.buildTimeout)
    }

    this.buildTimeout = setTimeout(() => {
      this.batchBuild()
    }, 1000) // 1秒延迟
  }

  /**
   * 监听文件变化
   */
  async watchPackages() {
    const packages = await this.getPackages()

    for (const pkg of packages) {
      const srcPath = join(pkg.path, 'src')
      
      if (existsSync(srcPath)) {
        console.log(`👀 监听 ${pkg.name} 的文件变化`)
        
        const watcher = chokidar.watch(srcPath, {
          ignored: /(^|[\/\\])\../, // 忽略隐藏文件
          persistent: true,
          ignoreInitial: true
        })

        watcher.on('change', (path) => {
          console.log(`📝 文件变化: ${path}`)
          this.debouncedBuild(pkg.name)
        })

        watcher.on('add', (path) => {
          console.log(`➕ 新增文件: ${path}`)
          this.debouncedBuild(pkg.name)
        })

        watcher.on('unlink', (path) => {
          console.log(`🗑️ 删除文件: ${path}`)
          this.debouncedBuild(pkg.name)
        })

        this.watchers.set(pkg.name, watcher)
      }
    }

    console.log('🎯 文件监听已启动，等待变化...')
  }

  /**
   * 停止监听
   */
  stopWatching() {
    for (const [name, watcher] of this.watchers) {
      watcher.close()
      console.log(`🛑 停止监听 ${name}`)
    }
    this.watchers.clear()
  }

  /**
   * 创建软链接进行联调
   */
  async linkPackages() {
    console.log('🔗 创建包之间的软链接...')
    
    try {
      // 使用 pnpm 的内置链接功能
      this.exec('pnpm install')
      console.log('✅ 软链接创建完成')
    } catch (error) {
      console.error('❌ 软链接创建失败:', error.message)
    }
  }

  /**
   * 检查依赖一致性
   */
  async checkDependencyConsistency() {
    console.log('🔍 检查依赖一致性...')
    
    const packages = await this.getPackages()
    const dependencyVersions = new Map()
    const inconsistencies = []

    // 收集所有依赖版本
    for (const pkg of packages) {
      const { dependencies = {}, devDependencies = {} } = pkg.packageJson
      
      for (const [name, version] of Object.entries({ ...dependencies, ...devDependencies })) {
        if (!dependencyVersions.has(name)) {
          dependencyVersions.set(name, new Set())
        }
        dependencyVersions.get(name).add(version)
      }
    }

    // 检查版本不一致
    for (const [name, versions] of dependencyVersions) {
      if (versions.size > 1 && !name.startsWith('@linch-kit/')) {
        inconsistencies.push({
          dependency: name,
          versions: Array.from(versions)
        })
      }
    }

    if (inconsistencies.length === 0) {
      console.log('✅ 依赖版本一致')
    } else {
      console.log('⚠️ 发现依赖版本不一致:')
      inconsistencies.forEach(({ dependency, versions }) => {
        console.log(`  ${dependency}: ${versions.join(', ')}`)
      })
    }

    return inconsistencies
  }

  /**
   * 生成开发环境配置
   */
  generateDevConfig() {
    const config = {
      // 开发服务器配置
      devServer: {
        port: 3000,
        host: 'localhost',
        hot: true,
        open: true
      },
      
      // 构建配置
      build: {
        watch: true,
        sourcemap: true,
        minify: false
      },
      
      // 代理配置
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      },
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        DEBUG: 'linch-kit:*'
      }
    }

    writeFileSync('dev.config.json', JSON.stringify(config, null, 2))
    console.log('✅ 开发配置已生成: dev.config.json')
  }

  /**
   * 启动开发模式
   */
  async startDev() {
    console.log('🚀 启动开发模式...')

    try {
      // 1. 检查依赖一致性
      await this.checkDependencyConsistency()

      // 2. 创建软链接
      await this.linkPackages()

      // 3. 初始构建
      console.log('🔨 初始构建...')
      this.exec('pnpm turbo build:packages')

      // 4. 生成开发配置
      this.generateDevConfig()

      // 5. 启动文件监听
      await this.watchPackages()

      // 6. 启动开发服务器
      console.log('🌐 启动开发服务器...')
      this.spawn('pnpm', ['turbo', 'dev', '--parallel'])

    } catch (error) {
      console.error('❌ 开发模式启动失败:', error.message)
      this.stopWatching()
      process.exit(1)
    }
  }

  /**
   * 清理开发环境
   */
  cleanup() {
    console.log('🧹 清理开发环境...')
    this.stopWatching()
    
    // 清理构建产物
    this.exec('pnpm turbo clean')
    
    // 清理 node_modules
    this.exec('find . -name "node_modules" -type d -prune -exec rm -rf {} +')
    
    console.log('✅ 清理完成')
  }
}

// 命令行接口
if (require.main === module) {
  const devTools = new DevTools()
  const command = process.argv[2]

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，正在清理...')
    devTools.stopWatching()
    process.exit(0)
  })

  switch (command) {
    case 'dev':
      devTools.startDev()
      break
    case 'watch':
      devTools.watchPackages()
      break
    case 'link':
      devTools.linkPackages()
      break
    case 'check':
      devTools.checkDependencyConsistency()
      break
    case 'cleanup':
      devTools.cleanup()
      break
    default:
      console.log(`
使用方法: node scripts/dev-tools.js <command>

命令:
  dev     - 启动完整开发模式
  watch   - 只启动文件监听
  link    - 创建包链接
  check   - 检查依赖一致性
  cleanup - 清理开发环境
      `)
  }
}

module.exports = { DevTools }
