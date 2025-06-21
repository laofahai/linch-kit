/**
 * 包级别的 i18n 工具
 * 
 * 为各个包提供统一的 i18n 实现模式
 */

import type { 
  TranslationFunction, 
  PackageI18nConfig, 
  I18nProps 
} from './types'
import { 
  createNamespacedTranslation, 
  createTranslationWithFallback,
  getGlobalTranslation 
} from './index'

/**
 * 包 i18n 管理器
 * 
 * 每个包应该创建一个实例来管理自己的翻译
 */
export class PackageI18n {
  private config: PackageI18nConfig
  private namespacedTranslation?: TranslationFunction

  constructor(config: PackageI18nConfig) {
    this.config = config
  }

  /**
   * 获取包的翻译函数
   * 
   * @param userT - 用户提供的翻译函数（可选）
   * @returns 翻译函数
   */
  getTranslation(userT?: TranslationFunction): TranslationFunction {
    // 优先使用用户提供的翻译函数
    const baseT = userT || getGlobalTranslation()
    
    // 创建带命名空间的翻译函数
    const namespacedT = baseT 
      ? createNamespacedTranslation(baseT, this.config.keyPrefix || this.config.packageName)
      : undefined

    // 创建带 fallback 的翻译函数
    const fallbackMessages = this.config.defaultMessages[this.config.defaultLocale] || {}
    
    return createTranslationWithFallback(namespacedT, fallbackMessages)
  }

  /**
   * 获取指定语言的默认消息
   * 
   * @param locale - 语言代码
   * @returns 消息映射
   */
  getDefaultMessages(locale?: string): Record<string, string> {
    const targetLocale = locale || this.config.defaultLocale
    return this.config.defaultMessages[targetLocale] || this.config.defaultMessages[this.config.defaultLocale] || {}
  }

  /**
   * 获取支持的语言列表
   * 
   * @returns 语言代码数组
   */
  getSupportedLocales(): string[] {
    return Object.keys(this.config.defaultMessages)
  }

  /**
   * 检查是否支持指定语言
   * 
   * @param locale - 语言代码
   * @returns 是否支持
   */
  isLocaleSupported(locale: string): boolean {
    return locale in this.config.defaultMessages
  }

  /**
   * 更新包配置
   * 
   * @param config - 新的配置
   */
  updateConfig(config: Partial<PackageI18nConfig>): void {
    this.config = { ...this.config, ...config }
    // 清除缓存的翻译函数
    this.namespacedTranslation = undefined
  }
}

/**
 * 创建包 i18n 实例的工厂函数
 * 
 * @param config - 包 i18n 配置
 * @returns 包 i18n 实例
 * 
 * @example
 * ```typescript
 * // 在包的 i18n/index.ts 中
 * import { createPackageI18n } from '@linch-kit/core'
 * 
 * const packageI18n = createPackageI18n({
 *   packageName: 'ui',
 *   defaultLocale: 'en',
 *   defaultMessages: {
 *     en: {
 *       'table.search': 'Search...',
 *       'table.noResults': 'No results found.'
 *     },
 *     'zh-CN': {
 *       'table.search': '搜索...',
 *       'table.noResults': '暂无数据'
 *     }
 *   }
 * })
 * 
 * // 导出翻译函数
 * export const uiT = (userT?: TranslationFunction) => packageI18n.getTranslation(userT)
 * ```
 */
export function createPackageI18n(config: PackageI18nConfig): PackageI18n {
  return new PackageI18n(config)
}

/**
 * 为组件创建 i18n hooks 的工厂函数
 * 
 * @param packageI18n - 包 i18n 实例
 * @returns hooks 对象
 * 
 * @example
 * ```typescript
 * // 在包的 i18n/hooks.ts 中
 * import { createI18nHooks } from '@linch-kit/core'
 * import { packageI18n } from './index'
 * 
 * export const { useTranslation, useNamespacedTranslation } = createI18nHooks(packageI18n)
 * ```
 */
export function createI18nHooks(packageI18n: PackageI18n) {
  return {
    /**
     * 基础翻译 hook
     */
    useTranslation: (props?: I18nProps) => {
      const t = packageI18n.getTranslation(props?.t)
      return { t, locale: props?.locale }
    },

    /**
     * 带命名空间的翻译 hook
     */
    useNamespacedTranslation: (namespace: string, props?: I18nProps) => {
      const baseT = packageI18n.getTranslation(props?.t)
      const namespacedT = createNamespacedTranslation(baseT, namespace)
      return { t: namespacedT, locale: props?.locale }
    }
  }
}

/**
 * 组件 i18n 属性处理工具
 * 
 * @param props - 组件属性
 * @param packageI18n - 包 i18n 实例
 * @returns 处理后的翻译函数
 */
export function resolveComponentI18n(
  props: I18nProps,
  packageI18n: PackageI18n
): TranslationFunction {
  return packageI18n.getTranslation(props.t)
}
