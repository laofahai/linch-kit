/**
 * LinchKit 统一国际化系统
 * 
 * 提供统一的 i18n 接口和工具函数，所有包都应该使用这个系统
 * 而不是自定义 i18n 实现
 */

export * from './types'
export * from './package-i18n'

import type { TranslationFunction, I18nContext } from './types'

/**
 * 全局 i18n 上下文
 */
let globalI18nContext: I18nContext | undefined

/**
 * 设置全局 i18n 上下文
 *
 * 应用启动时调用此函数设置全局翻译函数
 *
 * @param context - i18n 上下文
 *
 * @example
 * ```typescript
 * import { setGlobalI18nContext } from '@linch-kit/core'
 * import { useTranslation } from 'react-i18next'
 *
 * // 在应用启动时设置
 * function App() {
 *   const { t, i18n } = useTranslation()
 *
 *   useEffect(() => {
 *     setGlobalI18nContext({
 *       t,
 *       locale: i18n.language,
 *       supportedLocales: ['en', 'zh-CN']
 *     })
 *   }, [t, i18n.language])
 *
 *   return <YourApp />
 * }
 * ```
 */
export function setGlobalI18nContext(context: I18nContext): void {
  globalI18nContext = context
  // 同时设置到全局对象，供其他模块使用
  globalThis.__LINCH_I18N_CONTEXT__ = context
}

/**
 * 获取全局 i18n 上下文
 * 
 * @returns 当前的全局 i18n 上下文，如果未设置则返回 undefined
 */
export function getGlobalI18nContext(): I18nContext | undefined {
  return globalI18nContext
}

/**
 * 获取全局翻译函数
 * 
 * @returns 全局翻译函数，如果未设置则返回 undefined
 */
export function getGlobalTranslation(): TranslationFunction | undefined {
  return globalI18nContext?.t
}

/**
 * 获取当前语言
 * 
 * @returns 当前语言代码，如果未设置则返回 'en'
 */
export function getCurrentLocale(): string {
  return globalI18nContext?.locale || 'en'
}

/**
 * 检查是否已设置全局 i18n 上下文
 * 
 * @returns 是否已设置
 */
export function hasGlobalI18nContext(): boolean {
  return globalI18nContext !== undefined
}

/**
 * 清除全局 i18n 上下文
 * 
 * 主要用于测试环境
 */
export function clearGlobalI18nContext(): void {
  globalI18nContext = undefined
}

/**
 * 创建安全的翻译函数
 * 
 * 如果全局翻译函数不存在，返回 key 本身
 * 
 * @param key - 翻译键
 * @param params - 参数
 * @returns 翻译结果
 */
export function safeTranslate(key: string, params?: Record<string, any>): string {
  const t = getGlobalTranslation()
  if (t) {
    return t(key, params)
  }
  
  // 简单的参数替换 fallback
  let result = key
  if (params) {
    result = result.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName]?.toString() || match
    })
  }
  
  return result
}

/**
 * 默认的 i18n 上下文（用于 fallback）
 */
export const defaultI18nContext: I18nContext = {
  t: safeTranslate,
  locale: 'en',
  supportedLocales: ['en', 'zh-CN']
}
