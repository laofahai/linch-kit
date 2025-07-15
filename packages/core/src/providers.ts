/**
 * LinchKit Core - Provider 组合系统独立入口
 * 包含React组件和Hooks，必须在客户端环境使用
 * @module @linch-kit/core/providers
 */

'use client'

// Provider 组合系统 (包含React组件)
export {
  LinchKitProvider,
  withTRPCProvider,
  defaultLinchKitConfig,
  type LinchKitProviderConfig,
  type LinchKitProviderProps,
} from './providers/linchkit-provider'