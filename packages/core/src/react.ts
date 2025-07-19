'use client'

/**
 * LinchKit Core - React 组件入口
 * 包含所有 React 组件和 hooks，专用于客户端环境
 * @module @linch-kit/core/react
 */

// React 组件和 hooks
export {
  PageLoadingProvider,
  usePageLoading,
  PerformanceMonitor,
} from './react/performance-provider'

// 客户端安全的Logger (React 环境中使用)
export { logger as Logger } from './logger-client'

// 国际化 hooks
export {
  useTranslation,
  coreI18n,
} from './i18n'