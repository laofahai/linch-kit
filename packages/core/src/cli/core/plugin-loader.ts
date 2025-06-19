/**
 * @ai-context CLI 插件加载器核心系统
 * @ai-purpose 动态发现、加载和管理 CLI 命令插件，支持第三方包扩展
 * @ai-pattern Plugin Discovery + Dynamic Loading + Dependency Resolution
 * @ai-performance 懒加载设计，仅在需要时加载插件
 * @ai-dependencies glob, path, fs, @linch-kit/config
 */

import { pathToFileURL } from 'url'
import { resolve, join } from 'path'
import { existsSync, readFileSync } from 'fs'

import { glob } from 'glob'

import type { CommandPlugin, PluginDiscoveryResult } from '../../types'

import type { CommandRegistry } from './command-registry'

/**
 * @ai-class CLI 插件加载器
 * @ai-purpose 负责发现、验证、加载和管理所有 CLI 插件
 * @ai-singleton 全局唯一实例，确保插件加载的一致性
 * @ai-caching 缓存插件发现结果，避免重复扫描
 * @ai-error-recovery 单个插件失败不影响其他插件加载
 */
export class PluginLoader {
  private static instance: PluginLoader
  private discoveryCache = new Map<string, PluginDiscoveryResult>()
  private loadedPlugins = new Map<string, CommandPlugin>()
  private registry: CommandRegistry | null = null

  /**
   * @ai-constructor 私有构造函数，实现单例模式
   */
  private constructor() {}

  /**
   * @ai-method 获取插件加载器单例实例
   * @ai-pattern Singleton Factory
   * @ai-return PluginLoader - 全局唯一的插件加载器实例
   */
  static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader()
    }
    return PluginLoader.instance
  }

  /**
   * @ai-method 设置命令注册表引用
   * @ai-purpose 建立插件加载器与命令注册表的连接
   * @ai-parameter registry: CommandRegistry - 命令注册表实例
   * @ai-lifecycle 在系统初始化时调用
   */
  setRegistry(registry: CommandRegistry): void {
    this.registry = registry
  }

  /**
   * @ai-method 发现所有可用的 CLI 插件
   * @ai-purpose 扫描多个位置查找符合规范的插件
   * @ai-algorithm 并行扫描 + 结果合并 + 去重
   * @ai-caching 缓存发现结果，避免重复扫描
   * @ai-performance O(n) 文件系统扫描，O(1) 缓存命中
   * @ai-error-handling 单个插件发现失败不影响整体流程
   */
  async discoverPlugins(searchPaths?: string[]): Promise<PluginDiscoveryResult> {
    const cacheKey = JSON.stringify(searchPaths || 'default')

    // AI: 检查缓存
    if (this.discoveryCache.has(cacheKey)) {
      return this.discoveryCache.get(cacheKey)!
    }

    const startTime = Date.now()
    const plugins: CommandPlugin[] = []
    const errors: Array<{ pluginPath: string; error: string }> = []
    const scannedPaths: string[] = []

    // AI: 默认搜索路径
    const defaultSearchPaths = [
      'node_modules/@linch-kit/*',
      'node_modules/@linch-kit/plugin-*',
      'node_modules/@*/linch-kit-plugin-*',
      'plugins/*',
      '../plugins/*',
      '../../packages/*',
      process.env.LINCH_PLUGINS_PATH || '',
    ].filter(Boolean)

    const allSearchPaths = searchPaths || defaultSearchPaths

    // AI: 并行扫描所有搜索路径
    const discoveryPromises = allSearchPaths.map(async searchPath => {
      try {
        return await this.scanPluginPath(searchPath)
      } catch (error) {
        errors.push({
          pluginPath: searchPath,
          error: error instanceof Error ? error.message : String(error),
        })
        return { plugins: [], scannedPaths: [searchPath] }
      }
    })

    const results = await Promise.all(discoveryPromises)

    // AI: 合并结果
    results.forEach(result => {
      plugins.push(...result.plugins)
      scannedPaths.push(...result.scannedPaths)
    })

    // AI: 去重插件（按名称）
    const uniquePlugins = this.deduplicatePlugins(plugins)

    const discoveryResult: PluginDiscoveryResult = {
      plugins: uniquePlugins,
      errors,
      discoveryTime: Date.now() - startTime,
      scannedPaths,
    }

    // AI: 缓存结果
    this.discoveryCache.set(cacheKey, discoveryResult)

    return discoveryResult
  }

  /**
   * @ai-method 扫描单个插件路径
   * @ai-purpose 在指定路径中查找符合规范的插件
   * @ai-parameter searchPath: string - 搜索路径模式
   * @ai-return Promise<{plugins: CommandPlugin[], scannedPaths: string[]}> - 发现的插件和扫描路径
   * @ai-algorithm glob 模式匹配 + package.json 验证 + 插件加载
   */
  private async scanPluginPath(searchPath: string): Promise<{
    plugins: CommandPlugin[]
    scannedPaths: string[]
  }> {
    const plugins: CommandPlugin[] = []
    const scannedPaths: string[] = []

    try {
      // AI: 使用 glob 查找匹配的目录
      const matches = await glob(searchPath, {
        cwd: process.cwd(),
      })

      for (const match of matches) {
        const pluginPath = resolve(process.cwd(), match)
        scannedPaths.push(pluginPath)

        try {
          // AI: 验证是否为有效的插件目录
          const plugin = await this.loadPluginFromPath(pluginPath)
          if (plugin) {
            plugins.push(plugin)
          }
        } catch (error) {
          // AI: 记录单个插件加载错误，但不中断整体流程
          console.warn(`AI: Failed to load plugin from ${pluginPath}:`, error)
        }
      }
    } catch (error) {
      console.warn(`AI: Failed to scan plugin path ${searchPath}:`, error)
    }

    return { plugins, scannedPaths }
  }

  /**
   * @ai-method 从指定路径加载插件
   * @ai-purpose 验证并加载单个插件
   * @ai-parameter pluginPath: string - 插件目录路径
   * @ai-return Promise<CommandPlugin | null> - 加载的插件实例或 null
   * @ai-validation 验证 package.json 和插件入口文件
   * @ai-error-handling 加载失败返回 null，不抛出错误
   */
  private async loadPluginFromPath(pluginPath: string): Promise<CommandPlugin | null> {
    // AI: 检查 package.json 是否存在
    const packageJsonPath = join(pluginPath, 'package.json')
    if (!existsSync(packageJsonPath)) {
      return null
    }

    try {
      // AI: 读取和解析 package.json
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

      // AI: 验证是否为 Linch Kit 插件
      if (!this.isLinchKitPlugin(packageJson)) {
        return null
      }

      // AI: 确定插件入口文件
      const entryPoint = this.resolvePluginEntry(pluginPath, packageJson)
      if (!entryPoint) {
        return null
      }

      // AI: 动态导入插件模块
      const pluginModule = await import(pathToFileURL(entryPoint).href)
      let plugin = pluginModule.default || pluginModule

      // AI: 如果模块导出的不是直接的插件对象，尝试查找插件
      if (!this.validatePluginInterface(plugin)) {
        // 尝试查找常见的插件导出名称
        const possiblePluginNames = [
          `${packageJson.name.replace('@linch-kit/', '')}CliPlugin`,
          `${packageJson.name.replace('@linch-kit/', '')}Plugin`,
          'cliPlugin',
          'plugin'
        ]

        for (const pluginName of possiblePluginNames) {
          if (plugin[pluginName] && this.validatePluginInterface(plugin[pluginName])) {
            plugin = plugin[pluginName]
            break
          }
        }

        // 最后尝试查找任何符合接口的属性
        if (!this.validatePluginInterface(plugin)) {
          for (const [key, value] of Object.entries(plugin)) {
            if (this.validatePluginInterface(value)) {
              plugin = value
              break
            }
          }
        }
      }

      // AI: 验证插件接口
      if (!this.validatePluginInterface(plugin)) {
        return null
      }

      return plugin as CommandPlugin
    } catch (error) {
      console.warn(`AI: Failed to load plugin from ${pluginPath}:`, error)
      return null
    }
  }

  /**
   * @ai-method 验证是否为 Linch Kit 插件
   * @ai-purpose 通过 package.json 判断是否为有效的 Linch Kit 插件
   * @ai-parameter packageJson: any - package.json 内容
   * @ai-return boolean - 是否为有效插件
   * @ai-validation 检查包名、关键词、依赖等标识
   */
  private isLinchKitPlugin(packageJson: any): boolean {
    const name = packageJson.name || ''

    // AI: 首先检查是否明确标识为插件
    const isExplicitPlugin =
      name.includes('linch-kit-plugin') ||
      name.startsWith('@linch-kit/plugin-') ||
      name.startsWith('@*/linch-kit-plugin-')

    // AI: 检查关键词
    const keywords = packageJson.keywords || []
    const hasPluginKeyword =
      keywords.includes('linch-kit-plugin') ||
      keywords.includes('cli-plugin')

    // AI: 检查是否有 CLI 相关的导出或文件
    const hasCliExport =
      packageJson.exports && (packageJson.exports['./cli'] || packageJson.exports.cli)

    // AI: 检查是否有 CLI 字段
    const hasCliField = !!packageJson.cli

    // AI: 对于 @linch-kit/ 包，只有明确有 CLI 插件功能的才被认为是插件
    if (name.startsWith('@linch-kit/')) {
      // 已知的有 CLI 插件功能的包
      const knownCliPluginPackages = [
        '@linch-kit/auth-core',
        '@linch-kit/schema'
      ]

      return knownCliPluginPackages.includes(name) || hasCliField
    }

    // AI: 对于其他包，使用更严格的检查
    return isExplicitPlugin || hasPluginKeyword || hasCliExport || hasCliField
  }

  /**
   * @ai-method 解析插件入口文件路径
   * @ai-purpose 确定插件的主入口文件
   * @ai-parameter pluginPath: string - 插件目录路径
   * @ai-parameter packageJson: any - package.json 内容
   * @ai-return string | null - 入口文件绝对路径或 null
   * @ai-algorithm 按优先级检查：cli 字段 > main 字段 > 默认文件
   */
  private resolvePluginEntry(pluginPath: string, packageJson: any): string | null {
    // AI: 优先级1：检查 exports 中的 cli-plugin 字段（专门用于 CLI 插件）
    if (packageJson.exports) {
      const cliPluginExport = packageJson.exports['./cli-plugin']
      if (cliPluginExport) {
        const cliPluginPath =
          typeof cliPluginExport === 'string'
            ? cliPluginExport
            : cliPluginExport.require || cliPluginExport.import || cliPluginExport.default
        if (cliPluginPath) {
          const fullPath = join(pluginPath, cliPluginPath)
          if (existsSync(fullPath)) {
            return fullPath
          }
        }
      }
    }

    // AI: 优先级2：检查 cli 字段（专门用于 CLI 插件）
    if (packageJson.cli) {
      const cliEntry = join(pluginPath, packageJson.cli)
      if (existsSync(cliEntry)) {
        return cliEntry
      }
    }

    // AI: 优先级3：检查 main 字段
    if (packageJson.main) {
      const mainEntry = join(pluginPath, packageJson.main)
      if (existsSync(mainEntry)) {
        return mainEntry
      }
    }

    // AI: 优先级4：检查默认入口文件
    const defaultEntries = [
      'cli.js',
      'cli.ts',
      'index.js',
      'index.ts',
      'src/cli.js',
      'src/cli.ts',
      'src/index.js',
      'src/index.ts',
      'dist/cli.js',
      'dist/index.js',
      'dist/plugins/cli-plugin.js',
    ]

    for (const entry of defaultEntries) {
      const entryPath = join(pluginPath, entry)
      if (existsSync(entryPath)) {
        return entryPath
      }
    }

    return null
  }

  /**
   * @ai-method 验证插件接口
   * @ai-purpose 确保插件实现了必需的接口
   * @ai-parameter plugin: any - 插件对象
   * @ai-return boolean - 是否符合插件接口
   * @ai-validation 检查必需的属性和方法
   */
  private validatePluginInterface(plugin: any): boolean {
    return (
      plugin &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.register === 'function'
    )
  }

  /**
   * @ai-method 去重插件列表
   * @ai-purpose 移除重复的插件，保留版本最高的
   * @ai-parameter plugins: CommandPlugin[] - 插件列表
   * @ai-return CommandPlugin[] - 去重后的插件列表
   * @ai-algorithm 按名称分组 + 版本比较 + 保留最新版本
   */
  private deduplicatePlugins(plugins: CommandPlugin[]): CommandPlugin[] {
    const pluginMap = new Map<string, CommandPlugin>()

    plugins.forEach(plugin => {
      const existing = pluginMap.get(plugin.name)
      if (!existing || this.compareVersions(plugin.version, existing.version) > 0) {
        pluginMap.set(plugin.name, plugin)
      }
    })

    return Array.from(pluginMap.values())
  }

  /**
   * @ai-method 比较版本号
   * @ai-purpose 比较两个语义化版本号
   * @ai-parameter version1: string - 版本号1
   * @ai-parameter version2: string - 版本号2
   * @ai-return number - 比较结果 (1: v1>v2, 0: v1=v2, -1: v1<v2)
   * @ai-algorithm 简单的语义化版本比较
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  }

  /**
   * @ai-method 加载并注册所有发现的插件
   * @ai-purpose 批量加载插件并注册到命令系统
   * @ai-parameter searchPaths?: string[] - 可选的搜索路径
   * @ai-return Promise<{loaded: CommandPlugin[], failed: string[]}> - 加载结果
   * @ai-dependency-resolution 按依赖关系排序加载
   * @ai-error-handling 单个插件失败不影响其他插件
   */
  async loadAndRegisterPlugins(searchPaths?: string[]): Promise<{
    loaded: CommandPlugin[]
    failed: string[]
  }> {
    if (!this.registry) {
      throw new Error('AI: Registry not set. Call setRegistry() first.')
    }

    const discoveryResult = await this.discoverPlugins(searchPaths)
    const loaded: CommandPlugin[] = []
    const failed: string[] = []

    // AI: 按依赖关系排序插件
    const sortedPlugins = this.sortPluginsByDependencies(discoveryResult.plugins)

    // AI: 逐个加载和注册插件
    for (const plugin of sortedPlugins) {
      try {
        await this.registry.registerPlugin(plugin)
        this.loadedPlugins.set(plugin.name, plugin)
        loaded.push(plugin)
        console.log(`AI: Plugin '${plugin.name}' loaded successfully`)
      } catch (error) {
        failed.push(plugin.name)
        console.error(`AI: Failed to load plugin '${plugin.name}':`, error)
      }
    }

    return { loaded, failed }
  }

  /**
   * @ai-method 按依赖关系排序插件
   * @ai-purpose 确保依赖的插件先于依赖它的插件加载
   * @ai-parameter plugins: CommandPlugin[] - 插件列表
   * @ai-return CommandPlugin[] - 排序后的插件列表
   * @ai-algorithm 拓扑排序，处理依赖关系
   * @ai-error-handling 检测循环依赖并报错
   */
  private sortPluginsByDependencies(plugins: CommandPlugin[]): CommandPlugin[] {
    const pluginMap = new Map(plugins.map(p => [p.name, p]))
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const sorted: CommandPlugin[] = []

    function visit(pluginName: string) {
      if (visiting.has(pluginName)) {
        throw new Error(`AI: Circular dependency detected involving plugin '${pluginName}'`)
      }

      if (visited.has(pluginName)) {
        return
      }

      const plugin = pluginMap.get(pluginName)
      if (!plugin) {
        return // 依赖的插件不存在，跳过
      }

      visiting.add(pluginName)

      // AI: 先访问所有依赖
      if (plugin.dependencies) {
        plugin.dependencies.forEach(dep => visit(dep))
      }

      visiting.delete(pluginName)
      visited.add(pluginName)
      sorted.push(plugin)
    }

    // AI: 访问所有插件
    plugins.forEach(plugin => visit(plugin.name))

    return sorted
  }

  /**
   * @ai-method 获取已加载的插件列表
   * @ai-purpose 提供插件管理和调试功能
   * @ai-return CommandPlugin[] - 已加载的插件列表
   */
  getLoadedPlugins(): CommandPlugin[] {
    return Array.from(this.loadedPlugins.values())
  }

  /**
   * @ai-method 清除缓存
   * @ai-purpose 强制重新发现插件，用于开发和调试
   * @ai-side-effects 清空发现缓存
   */
  clearCache(): void {
    this.discoveryCache.clear()
  }
}
