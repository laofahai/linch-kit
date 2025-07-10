/**
 * tRPC module for platform package
 * @module platform/trpc
 */

// 核心CRUD tRPC工厂函数 (暂时注释，需要修复类型错误)
// export * from './crud-router-factory'

// 新增平台特定的tRPC增强
export * from './platform-router-factory'

// 创建tRPC客户端工具
export * from './client-factory'

// tRPC中间件
export * from './middleware'

// 简化的认证导出(避免循环依赖)
export { createAuthRouterFactory } from './auth-router-factory'

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
