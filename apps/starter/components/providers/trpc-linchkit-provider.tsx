/**
 * Starter 应用的 tRPC 集成 Provider
 * 使用 @linch-kit/core 的 withTRPCProvider 高阶组件
 */

'use client'

// 直接使用原始 TRPCProvider 而不是 withTRPCProvider
// 这样可以避免 createClient 方法问题
import { TRPCProvider, api } from './trpc-provider'

export { TRPCProvider as TRPCLinchKitProvider }

// 导出 tRPC 客户端实例供组件使用
export { api as trpc }