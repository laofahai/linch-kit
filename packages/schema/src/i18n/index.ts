/**
 * Schema 包国际化系统
 *
 * 基于 @linch-kit/core 的统一 i18n 架构
 */

import {
  createPackageI18n,
  type TranslationFunction
} from '@linch-kit/core'

import type { I18nText } from '../core/types'

/**
 * Schema 包的 i18n 配置
 */
const schemaPackageI18n = createPackageI18n({
  packageName: 'schema',
  defaultLocale: 'en',
  defaultMessages: {
    en: {
      // 默认的 Schema 相关翻译
      'entity.displayName': '{entityName}',
      'field.label': '{fieldName}',
    },
    'zh-CN': {
      'entity.displayName': '{entityName}',
      'field.label': '{fieldName}',
    }
  },
  keyPrefix: 'schema'
})

/**
 * 获取 Schema 翻译函数
 *
 * @param userT - 用户提供的翻译函数（可选）
 * @returns Schema 翻译函数
 */
export function getSchemaTranslation(userT?: TranslationFunction): TranslationFunction {
  return schemaPackageI18n.getTranslation(userT)
}

/**
 * Schema 翻译函数（向后兼容）
 */
export const t = getSchemaTranslation()

/**
 * 向后兼容的翻译函数类型
 */
export type TranslateFunction = TranslationFunction

/**
 * 设置全局翻译函数（向后兼容）
 */
export function setTranslateFunction(_translateFn: TranslationFunction): void {
  // 这个函数保留用于向后兼容，但建议使用新的模式
  console.warn('setTranslateFunction is deprecated. Use the new i18n pattern with component props.')
}

/**
 * 解析 i18n 文本（key 或普通字符串）
 *
 * @param text - 翻译键或普通字符串
 * @param params - 参数
 * @param userT - 用户翻译函数（可选）
 * @returns 翻译后的文本
 */
export function resolveI18nText(text: string | I18nText, params?: Record<string, any>, userT?: TranslationFunction): string {
  const translate = getSchemaTranslation(userT)
  return translate(text, params)
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
export function getFieldLabel(entityName: string, fieldName: string, customLabel?: string | I18nText, userT?: TranslationFunction): string {
  if (customLabel) {
    return resolveI18nText(customLabel, undefined, userT)
  }

  // 使用默认 key
  const key = generateDefaultKey(entityName, fieldName, 'label')
  const translate = getSchemaTranslation(userT)
  const translated = translate(key)

  // 如果没有翻译，使用字段名的友好格式
  if (translated === key) {
    return formatFieldName(fieldName)
  }

  return translated
}

export function getFieldDescription(entityName: string, fieldName: string, customDescription?: string | I18nText, userT?: TranslationFunction): string | undefined {
  if (customDescription) {
    return resolveI18nText(customDescription, undefined, userT)
  }

  const key = generateDefaultKey(entityName, fieldName, 'description')
  const translate = getSchemaTranslation(userT)
  const translated = translate(key)

  return translated === key ? undefined : translated
}

export function getFieldPlaceholder(entityName: string, fieldName: string, customPlaceholder?: string | I18nText, userT?: TranslationFunction): string | undefined {
  if (customPlaceholder) {
    return resolveI18nText(customPlaceholder, undefined, userT)
  }

  const key = generateDefaultKey(entityName, fieldName, 'placeholder')
  const translate = getSchemaTranslation(userT)
  const translated = translate(key)

  return translated === key ? undefined : translated
}

export function getFieldHelpText(entityName: string, fieldName: string, customHelpText?: string | I18nText, userT?: TranslationFunction): string | undefined {
  if (customHelpText) {
    return resolveI18nText(customHelpText, undefined, userT)
  }

  const key = generateDefaultKey(entityName, fieldName, 'helpText')
  const translate = getSchemaTranslation(userT)
  const translated = translate(key)

  return translated === key ? undefined : translated
}

export function getEntityDisplayName(entityName: string, customDisplayName?: string | I18nText, userT?: TranslationFunction): string {
  if (customDisplayName) {
    return resolveI18nText(customDisplayName, undefined, userT)
  }

  const key = generateEntityKey(entityName, 'displayName')
  const translate = getSchemaTranslation(userT)
  const translated = translate(key)

  return translated === key ? formatEntityName(entityName) : translated
}

export function getEntityDescription(entityName: string, customDescription?: string | I18nText, userT?: TranslationFunction): string | undefined {
  if (customDescription) {
    return resolveI18nText(customDescription, undefined, userT)
  }

  const key = generateEntityKey(entityName, 'description')
  const translate = getSchemaTranslation(userT)
  const translated = translate(key)

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


