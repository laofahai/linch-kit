/**
 * @fileoverview UI包基础设施 - 集成LinchKit Core功能
 */

import { Logger, createPackageI18n } from '@linch-kit/core/client'
import { useTranslation as coreUseTranslation } from '@linch-kit/core/react'

/**
 * UI包专用日志记录器
 */
const uiLogger = Logger

/**
 * UI包日志接口 - 避免类型导出问题
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => uiLogger.debug(message, data),
  info: (message: string, data?: Record<string, unknown>) => uiLogger.info(message, data),
  warn: (message: string, data?: Record<string, unknown>) => uiLogger.warn(message, data),
  error: (message: string, error?: Error | string, data?: Record<string, unknown>) => {
    if (typeof error === 'string') {
      uiLogger.error(message + ' ' + error, undefined, data)
    } else {
      uiLogger.error(message, error, data)
    }
  },
  fatal: (message: string, error?: Error, data?: Record<string, unknown>) =>
    uiLogger.fatal(message, error, data),
}

/**
 * UI包国际化配置
 */
const uiI18n = createPackageI18n({
  packageName: 'ui',
  defaultLocale: 'zh-CN',
  defaultMessages: {
    'zh-CN': {
      // 表单相关
      'form.create': '创建',
      'form.update': '更新',
      'form.cancel': '取消',
      'form.submitting': '提交中...',
      'form.create_title': '创建{entity}',
      'form.edit_title': '编辑{entity}',
      'form.view_title': '查看{entity}',

      // 表格相关
      'table.actions': '操作',
      'table.view': '查看',
      'table.edit': '编辑',
      'table.delete': '删除',
      'table.confirm_delete': '确认删除吗？',
      'table.list': '列表',
      'table.search': '搜索...',
      'table.no_data': '暂无数据',
      'table.showing': '显示',
      'table.of': '共',
      'table.entries': '条',
      'table.page': '第',
      'table.previous': '上一页',
      'table.next': '下一页',

      // 通用
      'common.yes': '是',
      'common.no': '否',
    },
    en: {
      // 表单相关
      'form.create': 'Create',
      'form.update': 'Update',
      'form.cancel': 'Cancel',
      'form.submitting': 'Submitting...',
      'form.create_title': 'Create {entity}',
      'form.edit_title': 'Edit {entity}',
      'form.view_title': 'View {entity}',

      // 表格相关
      'table.actions': 'Actions',
      'table.view': 'View',
      'table.edit': 'Edit',
      'table.delete': 'Delete',
      'table.confirm_delete': 'Are you sure to delete?',
      'table.list': 'List',
      'table.search': 'Search...',
      'table.no_data': 'No data',
      'table.showing': 'Showing',
      'table.of': 'of',
      'table.entries': 'entries',
      'table.page': 'Page',
      'table.previous': 'Previous',
      'table.next': 'Next',

      // 通用
      'common.yes': 'Yes',
      'common.no': 'No',
    },
  },
})

/**
 * UI组件国际化Hook
 * @returns UI组件的翻译函数
 */
export function useUITranslation() {
  // 使用Core包的翻译系统，获取用户传入的翻译函数
  const coreT = coreUseTranslation()

  // 返回UI包的翻译函数
  return {
    t: uiI18n.getTranslation(coreT),
  }
}

/**
 * 获取UI包配置 - 临时实现
 * @param key 配置键名
 * @param defaultValue 默认值
 */
export function getUIConfig<T>(_key: string, defaultValue?: T): T {
  // 临时实现，后续集成真实的配置系统
  return defaultValue as T
}

/**
 * UI主题配置类型
 */
export interface UIThemeConfig {
  colorMode: 'light' | 'dark' | 'auto'
  primaryColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  density: 'compact' | 'comfortable' | 'spacious'
}

/**
 * 获取UI主题配置
 */
export function getThemeConfig(): UIThemeConfig {
  return {
    colorMode: getUIConfig('theme.colorMode', 'auto'),
    primaryColor: getUIConfig('theme.primaryColor', '#3b82f6'),
    borderRadius: getUIConfig('theme.borderRadius', 'md'),
    density: getUIConfig('theme.density', 'comfortable'),
  }
}
