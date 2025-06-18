import type { I18nText } from '../core/types'

/**
 * 翻译函数类型 - 用户在应用中提供
 */
export type TranslateFunction = (key: string, params?: Record<string, any>) => string

/**
 * 全局翻译函数，由应用层设置
 */
let globalTranslate: TranslateFunction | undefined

/**
 * 设置全局翻译函数
 */
export function setTranslateFunction(translateFn: TranslateFunction): void {
  globalTranslate = translateFn
}

/**
 * 获取翻译文本
 */
export function t(key: string, params?: Record<string, any>): string {
  if (globalTranslate) {
    return globalTranslate(key, params)
  }
  // fallback: 返回 key 本身
  return key
}

/**
 * 解析 i18n 文本（key 或普通字符串）
 */
export function resolveI18nText(text: string | I18nText, params?: Record<string, any>): string {
  // 现在 I18nText 就是 string，直接调用翻译函数
  return t(text, params)
}

/**
 * 生成默认的 i18n key
 */
export function generateDefaultKey(entityName: string, fieldName: string, type: 'label' | 'description' | 'placeholder' | 'helpText'): string {
  return `schema.${entityName}.fields.${fieldName}.${type}`
}

export function generateEntityKey(entityName: string, type: 'displayName' | 'description'): string {
  return `schema.${entityName}.${type}`
}

/**
 * Schema 字段 i18n 工具函数
 */
export function getFieldLabel(entityName: string, fieldName: string, customLabel?: string | I18nText): string {
  if (customLabel) {
    return resolveI18nText(customLabel)
  }

  // 使用默认 key
  const key = generateDefaultKey(entityName, fieldName, 'label')
  const translated = t(key)

  // 如果没有翻译，使用字段名的友好格式
  if (translated === key) {
    return formatFieldName(fieldName)
  }

  return translated
}

export function getFieldDescription(entityName: string, fieldName: string, customDescription?: string | I18nText): string | undefined {
  if (customDescription) {
    return resolveI18nText(customDescription)
  }

  const key = generateDefaultKey(entityName, fieldName, 'description')
  const translated = t(key)

  return translated === key ? undefined : translated
}

export function getFieldPlaceholder(entityName: string, fieldName: string, customPlaceholder?: string | I18nText): string | undefined {
  if (customPlaceholder) {
    return resolveI18nText(customPlaceholder)
  }

  const key = generateDefaultKey(entityName, fieldName, 'placeholder')
  const translated = t(key)

  return translated === key ? undefined : translated
}

export function getFieldHelpText(entityName: string, fieldName: string, customHelpText?: string | I18nText): string | undefined {
  if (customHelpText) {
    return resolveI18nText(customHelpText)
  }

  const key = generateDefaultKey(entityName, fieldName, 'helpText')
  const translated = t(key)

  return translated === key ? undefined : translated
}

export function getEntityDisplayName(entityName: string, customDisplayName?: string | I18nText): string {
  if (customDisplayName) {
    return resolveI18nText(customDisplayName)
  }

  const key = generateEntityKey(entityName, 'displayName')
  const translated = t(key)

  return translated === key ? formatEntityName(entityName) : translated
}

export function getEntityDescription(entityName: string, customDescription?: string | I18nText): string | undefined {
  if (customDescription) {
    return resolveI18nText(customDescription)
  }

  const key = generateEntityKey(entityName, 'description')
  const translated = t(key)

  return translated === key ? undefined : translated
}

/**
 * 格式化字段名（驼峰转友好格式）
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * 格式化实体名（驼峰转友好格式）
 */
function formatEntityName(entityName: string): string {
  return entityName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}


