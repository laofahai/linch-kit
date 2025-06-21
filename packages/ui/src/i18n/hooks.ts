/**
 * UI 组件 i18n React Hooks
 *
 * 基于 @linch-kit/core 的统一 i18n 架构
 */

import { useCallback } from 'react'
import { type TranslationFunction, type I18nProps } from '@linch-kit/core'
import { getUITranslation, createNamespacedT } from './index'

/**
 * UI 翻译 Hook
 *
 * @param namespace 可选的命名空间前缀
 * @param props i18n 属性（包含用户翻译函数）
 * @returns 翻译函数
 *
 * @example
 * ```tsx
 * function DataTable({ t: userT }: { t?: TranslationFunction }) {
 *   const { t } = useTranslation('table', { t: userT })
 *
 *   return (
 *     <div>
 *       <input placeholder={t('search')} />
 *       <span>{t('noResults')}</span>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTranslation(namespace?: string, props?: I18nProps) {
  const t = useCallback<TranslationFunction>(
    (key: string, params?: Record<string, any>) => {
      if (namespace) {
        return createNamespacedT(namespace, props?.t)(key, params)
      }
      return getUITranslation(props?.t)(key, params)
    },
    [namespace, props?.t]
  )

  return { t, locale: props?.locale }
}

/**
 * 表格翻译 Hook（预设命名空间）
 */
export function useTableTranslation(props?: I18nProps) {
  return useTranslation('table', props)
}

/**
 * 表单翻译 Hook（预设命名空间）
 */
export function useFormTranslation(props?: I18nProps) {
  return useTranslation('form', props)
}

/**
 * 选择器翻译 Hook（预设命名空间）
 */
export function useSelectTranslation(props?: I18nProps) {
  return useTranslation('select', props)
}

/**
 * 对话框翻译 Hook（预设命名空间）
 */
export function useDialogTranslation(props?: I18nProps) {
  return useTranslation('dialog', props)
}

/**
 * 通用翻译 Hook（预设命名空间）
 */
export function useCommonTranslation(props?: I18nProps) {
  return useTranslation('common', props)
}
