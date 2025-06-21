/**
 * LinchKit 统一国际化类型定义
 * 
 * 所有包都应该使用这些统一的类型，而不是自定义 i18n 实现
 */

/**
 * 翻译函数类型
 * 
 * @param key - 翻译键，支持嵌套格式如 'user.name' 或 'table.actions.edit'
 * @param params - 可选的参数对象，用于字符串插值
 * @returns 翻译后的字符串
 * 
 * @example
 * ```typescript
 * const t: TranslationFunction = (key, params) => {
 *   // 用户的 i18n 实现
 *   return i18n.t(key, params)
 * }
 * 
 * // 使用示例
 * t('user.welcome', { name: 'John' }) // "欢迎，John！"
 * t('table.rowsSelected', { count: 5 }) // "已选择 5 行"
 * ```
 */
export type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * i18n 上下文接口
 * 
 * 包含翻译函数和当前语言信息
 */
export interface I18nContext {
  /** 翻译函数 */
  t: TranslationFunction
  /** 当前语言代码 */
  locale: string
  /** 支持的语言列表 */
  supportedLocales?: string[]
}

/**
 * 组件 i18n 属性接口
 * 
 * 所有支持国际化的组件都应该接受这些属性
 */
export interface I18nProps {
  /** 翻译函数，如果不提供则使用默认英文文本 */
  t?: TranslationFunction
  /** 当前语言代码 */
  locale?: string
}

/**
 * 包级别的 i18n 配置接口
 * 
 * 每个包可以定义自己的默认翻译键和 fallback 文本
 */
export interface PackageI18nConfig {
  /** 包名，用于生成翻译键前缀 */
  packageName: string
  /** 默认语言 */
  defaultLocale: string
  /** 默认翻译映射 */
  defaultMessages: Record<string, Record<string, string>>
  /** 翻译键前缀，默认为包名 */
  keyPrefix?: string
}

/**
 * 翻译键生成器类型
 */
export type KeyGenerator = (namespace: string, key: string) => string

/**
 * 默认翻译键生成器
 * 
 * @param namespace - 命名空间（通常是包名或组件名）
 * @param key - 翻译键
 * @returns 完整的翻译键
 * 
 * @example
 * ```typescript
 * generateKey('ui', 'table.search') // "ui.table.search"
 * generateKey('auth', 'login.title') // "auth.login.title"
 * ```
 */
export const generateKey: KeyGenerator = (namespace: string, key: string) => {
  return `${namespace}.${key}`
}

/**
 * 创建带命名空间的翻译函数
 * 
 * @param t - 原始翻译函数
 * @param namespace - 命名空间
 * @returns 带命名空间的翻译函数
 * 
 * @example
 * ```typescript
 * const uiT = createNamespacedTranslation(t, 'ui')
 * uiT('table.search') // 等同于 t('ui.table.search')
 * ```
 */
export function createNamespacedTranslation(
  t: TranslationFunction,
  namespace: string
): TranslationFunction {
  return (key: string, params?: Record<string, any>) => {
    return t(generateKey(namespace, key), params)
  }
}

/**
 * 创建带 fallback 的翻译函数
 * 
 * @param t - 原始翻译函数
 * @param fallbackMessages - fallback 消息映射
 * @returns 带 fallback 的翻译函数
 */
export function createTranslationWithFallback(
  t: TranslationFunction | undefined,
  fallbackMessages: Record<string, string>
): TranslationFunction {
  return (key: string, params?: Record<string, any>) => {
    // 如果有用户提供的翻译函数，优先使用
    if (t) {
      const result = t(key, params)
      // 如果翻译函数返回的是 key 本身，说明没有找到翻译，使用 fallback
      if (result !== key) {
        return result
      }
    }
    
    // 使用 fallback 消息
    let message = fallbackMessages[key] || key
    
    // 参数替换
    if (params) {
      message = message.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName]?.toString() || match
      })
    }
    
    return message
  }
}

/**
 * i18n 工具函数集合
 */
export const I18nUtils = {
  generateKey,
  createNamespacedTranslation,
  createTranslationWithFallback,
}
