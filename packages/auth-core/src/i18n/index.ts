/**
 * Auth Core 国际化模块
 */

export {
  defaultMessages,
  getMessage,
  isSupportedLocale,
  getSupportedLocales
} from './messages'

/**
 * 翻译函数类型
 */
export type TranslateFunction = (key: string, params?: Record<string, any>) => string

/**
 * 全局翻译函数
 */
let globalTranslateFunction: TranslateFunction | null = null

/**
 * 设置全局翻译函数
 * 
 * @param translateFn 翻译函数，通常来自 vue-i18n 或 react-i18next
 */
export function setTranslateFunction(translateFn: TranslateFunction): void {
  globalTranslateFunction = translateFn
}

/**
 * 获取翻译文本
 * 
 * @param key 翻译键
 * @param params 参数
 * @param fallbackLocale 回退语言
 * @returns 翻译后的文本
 */
export function t(key: string, params?: Record<string, any>, fallbackLocale: string = 'en'): string {
  // 如果设置了全局翻译函数，优先使用
  if (globalTranslateFunction) {
    try {
      return globalTranslateFunction(key, params)
    } catch (error) {
      // 如果翻译失败，回退到内置消息
      console.warn(`Translation failed for key: ${key}`, error)
    }
  }

  // 使用内置消息作为回退
  return getMessage(key, fallbackLocale, params)
}

/**
 * 创建带命名空间的翻译函数
 * 
 * @param namespace 命名空间前缀
 * @returns 翻译函数
 */
export function createNamespacedT(namespace: string) {
  return (key: string, params?: Record<string, any>, fallbackLocale?: string) => {
    const namespacedKey = `${namespace}.${key}`
    return t(namespacedKey, params, fallbackLocale)
  }
}

/**
 * Auth 专用翻译函数
 */
export const authT = createNamespacedT('auth')
