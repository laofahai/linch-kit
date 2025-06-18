/**
 * Auth Core 国际化支持
 *
 * 采用类似 @linch-kit/schema 的设计，支持传入外部翻译函数
 */

/**
 * 翻译函数类型
 */
export type TranslateFunction = (key: string, params?: Record<string, any>, fallback?: string) => string

/**
 * i18n 配置接口
 */
export interface I18nConfig {
  /** 翻译函数 */
  t?: TranslateFunction
  /** 默认语言 */
  defaultLocale?: string
  /** 当前语言 */
  locale?: string
  /** 是否启用调试 */
  debug?: boolean
}

/**
 * 全局 i18n 配置
 */
let globalI18nConfig: I18nConfig = {
  defaultLocale: 'zh-CN',
  locale: 'zh-CN',
  debug: false
}

/**
 * 设置 i18n 配置
 */
export function setI18nConfig(config: I18nConfig): void {
  globalI18nConfig = { ...globalI18nConfig, ...config }
}

/**
 * 获取当前 i18n 配置
 */
export function getI18nConfig(): I18nConfig {
  return globalI18nConfig
}

/**
 * 设置翻译函数（向后兼容）
 */
export function setTranslateFunction(translateFn: TranslateFunction): void {
  setI18nConfig({ t: translateFn })
}

/**
 * 获取翻译函数
 */
export function getTranslateFunction(): TranslateFunction {
  return globalI18nConfig.t || defaultTranslateFunction
}

/**
 * Auth 翻译函数
 *
 * @param key 翻译键
 * @param params 参数
 * @param fallback 回退文本
 * @returns 翻译后的文本
 */
export function authT(key: string, params?: Record<string, any>, fallback?: string): string {
  const translateFn = getTranslateFunction()
  const result = translateFn(key, params, fallback)

  if (globalI18nConfig.debug && result === key) {
    console.warn(`[auth-core] Missing translation for key: ${key}`)
  }

  return result
}

/**
 * 创建带命名空间的翻译函数
 */
export function createNamespacedT(namespace: string) {
  return (key: string, params?: Record<string, any>, fallback?: string) => {
    return authT(`${namespace}.${key}`, params, fallback)
  }
}

/**
 * 默认翻译函数（使用内置消息）
 */
function defaultTranslateFunction(key: string, params?: Record<string, any>, fallback?: string): string {
  const locale = globalI18nConfig.locale || 'zh-CN'
  const localeMessages = defaultMessages[locale as keyof typeof defaultMessages] || defaultMessages['zh-CN']
  const message = localeMessages[key as keyof typeof localeMessages] || fallback || key

  if (!params) {
    return message
  }

  // 统一使用 {param} 格式的参数替换
  return message.replace(/\{(\w+)\}/g, (match, paramName) => {
    return params[paramName]?.toString() || match
  })
}

// 导入统一的消息定义
import { defaultMessages } from './messages'

/**
 * 获取支持的语言列表
 */
export function getSupportedLocales(): string[] {
  return Object.keys(defaultMessages)
}

/**
 * 检查是否支持指定语言
 */
export function isLocaleSupported(locale: string): boolean {
  return locale in defaultMessages
}

/**
 * 获取指定语言的所有消息
 */
export function getMessages(locale?: string): Record<string, string> {
  const targetLocale = locale || globalI18nConfig.locale || 'zh-CN'
  return defaultMessages[targetLocale as keyof typeof defaultMessages] || defaultMessages['zh-CN']
}

// 导出向后兼容的函数
export { authT as t }
export { defaultMessages }
export const getMessage = (key: string, locale?: string, params?: Record<string, any>) => {
  const targetLocale = locale || globalI18nConfig.locale || 'zh-CN'
  const localeMessages = defaultMessages[targetLocale as keyof typeof defaultMessages] || defaultMessages['zh-CN']
  const message = localeMessages[key as keyof typeof localeMessages] || key

  if (!params) {
    return message
  }

  // 统一使用 {param} 格式
  return message.replace(/\{(\w+)\}/g, (match, paramName) => {
    return params[paramName]?.toString() || match
  })
}
export const isSupportedLocale = isLocaleSupported
