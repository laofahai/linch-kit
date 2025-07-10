/**
 * tRPC module for platform package
 * @module platform/trpc
 */

// 重新导出认证包中的tRPC功能 (简化版本，避免导入错误)
export const authRouter = null // 占位符，实际使用时需要正确配置
export const createAuthRouterFactory = null // 占位符，实际使用时需要正确配置

// 新增平台特定的tRPC增强
export * from './platform-router-factory'

// 创建tRPC客户端工具
export * from './client-factory'

// tRPC中间件
export * from './middleware'

// tRPC类型定义 (重命名以避免冲突)
export type {
  TRPCOperation,
  TRPCContext,
  TRPCErrorCode,
  TRPCError,
  TRPCInputValidator,
  TRPCOutputTransformer,
  TRPCProcedure,
  TRPCRouter,
  TRPCRouterConfig,
  TRPCBatchRequest,
  TRPCBatchResponse,
  TRPCSubscriptionConfig,
  TRPCWebSocketMessage,
  TRPCServerOptions,
  TRPCMiddlewareOptions,
  TRPCRouteMetadata,
  TRPCMetrics,
  TRPCHealthCheck,
  TRPCDocumentationOptions,
  TRPCSecurityOptions,
  TRPCPlugin,
} from './types'

// 重新导出客户端选项（重命名以避免冲突）
export type { TRPCClientOptions as PlatformTRPCClientOptions } from './types'
