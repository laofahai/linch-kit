/**
 * Auth 组件国际化系统
 *
 * 基于 @linch-kit/core 的统一 i18n 架构
 */

import {
  createPackageI18n,
  type TranslationFunction,
  type I18nProps
} from '@linch-kit/core'
import { defaultMessages } from './messages'

/**
 * Auth 包的 i18n 配置
 */
const authPackageI18n = createPackageI18n({
  packageName: 'auth',
  defaultLocale: 'en',
  defaultMessages,
  keyPrefix: 'auth'
})

/**
 * 向后兼容的翻译函数类型
 */
export type TranslateFunction = (key: string, params?: Record<string, any>, fallback?: string) => TranslationFunction

/**
 * 获取 Auth 翻译函数
 *
 * @param userT - 用户提供的翻译函数（可选）
 * @returns Auth 翻译函数
 */
export function getAuthTranslation(userT?: TranslationFunction): TranslationFunction {
  return authPackageI18n.getTranslation(userT)
}

/**
 * Auth 翻译函数（向后兼容）
 */
export const authT = getAuthTranslation()

/**
 * 创建带命名空间的翻译函数
 */
export function createNamespacedT(namespace: string, userT?: TranslationFunction) {
  const baseT = getAuthTranslation(userT)
  return (key: string, params?: Record<string, any>) => {
    return baseT(`${namespace}.${key}`, params)
  }
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLocales(): string[] {
  return authPackageI18n.getSupportedLocales()
}

/**
 * 检查是否支持指定语言
 */
export function isLocaleSupported(locale: string): boolean {
  return authPackageI18n.isLocaleSupported(locale)
}

/**
 * 获取指定语言的所有消息
 */
export function getMessages(locale?: string): Record<string, string> {
  return authPackageI18n.getDefaultMessages(locale)
}

// 导出向后兼容的函数
export { authT as t }
export { defaultMessages }

// 向后兼容的消息获取函数
export const getMessage = (key: string, locale?: string, params?: Record<string, any>) => {
  const messages = getMessages(locale)
  let message = messages[key] || key

  if (params) {
    message = message.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName]?.toString() || match
    })
  }

  return message
}

export const isSupportedLocale = isLocaleSupported
