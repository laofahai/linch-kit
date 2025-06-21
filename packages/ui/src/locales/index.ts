/**
 * UI 包国际化配置
 */

import { createPackageI18n } from '@linch-kit/core'

// 导入翻译资源
import enCommon from './en/common.json'
import enComponents from './en/components.json'
import zhCNCommon from './zh-CN/common.json'
import zhCNComponents from './zh-CN/components.json'

// 创建 UI 包的 i18n 实例
export const { t: uiT, useTranslation } = createPackageI18n('ui', {
  fallbackLng: 'en',
  defaultNS: 'common',
  resources: {
    en: {
      common: enCommon,
      components: enComponents
    },
    'zh-CN': {
      common: zhCNCommon,
      components: zhCNComponents
    }
  }
})

// 导出翻译函数供组件使用
export { uiT as t }

// 导出命名空间常量
export const UI_NAMESPACES = {
  COMMON: 'common',
  COMPONENTS: 'components'
} as const

// 导出类型
export type UINamespace = typeof UI_NAMESPACES[keyof typeof UI_NAMESPACES]
