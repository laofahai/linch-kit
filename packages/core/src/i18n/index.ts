/**
 * 国际化模块
 * @description 为LinchKit包提供国际化支持，采用传入翻译函数的设计模式
 * @module i18n
 * @since 0.1.0
 */

/**
 * 翻译函数类型定义
 * @description 标准的翻译函数接口，接收key和参数，返回翻译文本
 */
export type TranslationFunction = (key: string, params?: Record<string, unknown>) => string

/**
 * 包级国际化配置选项
 */
export interface PackageI18nOptions {
  /** 包名称，用于命名空间 */
  packageName: string
  /** 默认语言 */
  defaultLocale: string
  /** 默认翻译消息 */
  defaultMessages: Record<string, Record<string, string>>
  /** 消息键前缀，默认使用包名 */
  keyPrefix?: string
}

/**
 * 包级国际化实例
 */
export interface PackageI18n {
  /**
   * 获取翻译函数
   * @param userT 用户提供的翻译函数
   * @returns 翻译函数
   */
  getTranslation(userT?: TranslationFunction): TranslationFunction

  /**
   * 获取默认消息
   * @param locale 语言代码
   * @returns 该语言的消息对象
   */
  getDefaultMessages(locale: string): Record<string, string>

  /**
   * 获取带命名空间的键
   * @param key 原始键
   * @returns 带命名空间的键
   */
  getNamespacedKey(key: string): string
}

/**
 * 创建包级国际化实例
 * @description 为每个LinchKit包创建独立的国际化实例，支持命名空间和回退机制
 * @param options 配置选项
 * @returns 包级国际化实例
 * @example
 * ```typescript
 * // 在包中创建i18n实例
 * const packageI18n = createPackageI18n({
 *   packageName: 'core',
 *   defaultLocale: 'en',
 *   defaultMessages: {
 *     en: {
 *       'plugin.load.success': 'Plugin {name} loaded successfully',
 *       'plugin.load.error': 'Failed to load plugin {name}'
 *     },
 *     'zh-CN': {
 *       'plugin.load.success': '插件 {name} 加载成功',
 *       'plugin.load.error': '插件 {name} 加载失败'
 *     }
 *   }
 * })
 *
 * // 导出翻译函数获取器
 * export const useTranslation = (userT?: TranslationFunction) =>
 *   packageI18n.getTranslation(userT)
 * ```
 * @since 0.1.0
 */
export function createPackageI18n(options: PackageI18nOptions): PackageI18n {
  const { packageName, defaultLocale, defaultMessages, keyPrefix = packageName } = options

  return {
    getTranslation(userT?: TranslationFunction): TranslationFunction {
      return (key: string, params?: Record<string, unknown>) => {
        // 生成带命名空间的键
        const namespacedKey = keyPrefix ? `${keyPrefix}.${key}` : key

        // 如果用户提供了翻译函数，优先使用
        if (userT) {
          try {
            const translated = userT(namespacedKey, params)
            // 如果翻译结果不等于key（即找到了翻译），则返回
            if (translated !== namespacedKey) {
              return translated
            }
          } catch {
            // 用户翻译函数出错，继续使用回退机制
          }
        }

        // 回退到默认消息
        const currentLocaleMessages = defaultMessages[defaultLocale] || {}
        const fallbackMessage = currentLocaleMessages[key] || key

        // 简单的参数插值
        if (params && typeof fallbackMessage === 'string') {
          return fallbackMessage.replace(/\{([^}]+)\}/g, (match, paramKey) => {
            const value = params[paramKey]
            return value !== undefined ? String(value) : match
          })
        }

        return fallbackMessage
      }
    },

    getDefaultMessages(locale: string): Record<string, string> {
      return defaultMessages[locale] || defaultMessages[defaultLocale] || {}
    },

    getNamespacedKey(key: string): string {
      return keyPrefix ? `${keyPrefix}.${key}` : key
    },
  }
}

/**
 * 默认的核心包国际化实例
 * @description @linch-kit/core 包的默认国际化配置
 * @since 0.1.0
 */
export const coreI18n = createPackageI18n({
  packageName: 'core',
  defaultLocale: 'en',
  defaultMessages: {
    en: {
      // 插件系统消息
      'plugin.register.success': 'Plugin {name} registered successfully',
      'plugin.register.error': 'Failed to register plugin {name}: {error}',
      'plugin.register.duplicate': 'Plugin {name} is already registered',
      'plugin.start.success': 'Plugin {name} started successfully',
      'plugin.start.error': 'Failed to start plugin {name}: {error}',
      'plugin.stop.success': 'Plugin {name} stopped successfully',
      'plugin.stop.error': 'Failed to stop plugin {name}: {error}',
      'plugin.dependency.missing': 'Plugin {name} requires dependency {dependency}',
      'plugin.dependency.circular': 'Circular dependency detected: {cycle}',

      // 配置管理消息
      'config.load.success': 'Configuration loaded from {source}',
      'config.load.error': 'Failed to load configuration from {source}: {error}',
      'config.validate.error': 'Configuration validation failed: {error}',
      'config.watch.started': 'Configuration watching started for {source}',
      'config.watch.changed': 'Configuration changed: {key}',

      // 可观测性消息
      'observability.metrics.exported': 'Metrics exported successfully',
      'observability.health.check.passed': 'Health check passed: {name}',
      'observability.health.check.failed': 'Health check failed: {name}: {error}',
      'observability.trace.started': 'Tracing started: {name}',
      'observability.trace.finished': 'Tracing finished: {name} ({duration}ms)',

      // CLI系统消息
      'cli.command.registered': 'Command {name} registered successfully',
      'cli.command.executed': 'Command {name} executed successfully',
      'cli.command.error': 'Command {name} failed: {error}',
      'cli.command.not.found': 'Command {name} not found',
      'cli.command.duplicate': 'Command {name} already exists',
      'cli.info.description': 'AI-First full-stack development framework',
      'cli.init.starting': 'LinchKit project initialization starting',

      // 租户配置消息
      'config.tenant.exists': 'Tenant {tenantId} already exists',
      'config.tenant.not.found': 'Tenant {tenantId} not found',
      'config.tenant.validate.error': 'Tenant {tenantId} validation failed: {error}',
      'config.source.unsupported': 'Unsupported config source type: {type}',
      'config.source.file.not.implemented': 'File config source not implemented yet',
      'config.source.remote.not.implemented': 'Remote config source not implemented yet',

      // 监听器消息
      'config.watcher.exists': 'Watcher {watcherId} already exists',
      'config.watcher.not.found': 'Watcher {watcherId} not found',
      'config.watcher.path.not.found': 'Watch path not found: {path}',
      'config.watcher.no.valid.paths': 'No valid paths to watch',
    },
    'zh-CN': {
      // 插件系统消息
      'plugin.register.success': '插件 {name} 注册成功',
      'plugin.register.error': '插件 {name} 注册失败: {error}',
      'plugin.register.duplicate': '插件 {name} 已经注册',
      'plugin.start.success': '插件 {name} 启动成功',
      'plugin.start.error': '插件 {name} 启动失败: {error}',
      'plugin.stop.success': '插件 {name} 停止成功',
      'plugin.stop.error': '插件 {name} 停止失败: {error}',
      'plugin.dependency.missing': '插件 {name} 需要依赖 {dependency}',
      'plugin.dependency.circular': '检测到循环依赖: {cycle}',

      // 配置管理消息
      'config.load.success': '配置从 {source} 加载成功',
      'config.load.error': '从 {source} 加载配置失败: {error}',
      'config.validate.error': '配置验证失败: {error}',
      'config.watch.started': '配置监听已启动: {source}',
      'config.watch.changed': '配置已更改: {key}',

      // 可观测性消息
      'observability.metrics.exported': '指标导出成功',
      'observability.health.check.passed': '健康检查通过: {name}',
      'observability.health.check.failed': '健康检查失败: {name}: {error}',
      'observability.trace.started': '追踪开始: {name}',
      'observability.trace.finished': '追踪完成: {name} ({duration}ms)',

      // CLI系统消息
      'cli.command.registered': '命令 {name} 注册成功',
      'cli.command.executed': '命令 {name} 执行成功',
      'cli.command.error': '命令 {name} 执行失败: {error}',
      'cli.command.not.found': '命令 {name} 未找到',
      'cli.command.duplicate': '命令 {name} 已存在',
      'cli.info.description': 'AI优先的全栈开发框架',
      'cli.init.starting': 'LinchKit 项目初始化开始',

      // 租户配置消息
      'config.tenant.exists': '租户 {tenantId} 已存在',
      'config.tenant.not.found': '租户 {tenantId} 未找到',
      'config.tenant.validate.error': '租户 {tenantId} 验证失败: {error}',
      'config.source.unsupported': '不支持的配置源类型: {type}',
      'config.source.file.not.implemented': '文件配置源尚未实现',
      'config.source.remote.not.implemented': '远程配置源尚未实现',

      // 监听器消息
      'config.watcher.exists': '监听器 {watcherId} 已存在',
      'config.watcher.not.found': '监听器 {watcherId} 未找到',
      'config.watcher.path.not.found': '监听路径未找到: {path}',
      'config.watcher.no.valid.paths': '没有有效的监听路径',
    },
  },
})

/**
 * 获取核心包的翻译函数
 * @description 为@linch-kit/core包提供翻译功能，支持用户传入自定义翻译函数
 * @param userT 用户提供的翻译函数
 * @returns 翻译函数
 * @example
 * ```typescript
 * import { useTranslation } from '@linch-kit/core'
 *
 * // 使用默认翻译
 * const t = useTranslation()
 * console.log(t('plugin.register.success', { name: 'my-plugin' }))
 *
 * // 使用自定义翻译函数
 * const customT = (key: string) => myTranslationLibrary.t(key)
 * const t = useTranslation(customT)
 * ```
 * @since 0.1.0
 */
export const useTranslation = (userT?: TranslationFunction) => coreI18n.getTranslation(userT)

// 向后兼容的导出
export type { TranslationFunction as I18nManager }

/**
 * @deprecated 使用 useTranslation() 替代
 */
export const i18n = {
  t: useTranslation(),
  setLocale: () => {
    console.warn('i18n.setLocale is deprecated, please use user-provided translation function')
  },
  getLocale: () => {
    console.warn('i18n.getLocale is deprecated, please use user-provided translation function')
    return 'en'
  },
}
