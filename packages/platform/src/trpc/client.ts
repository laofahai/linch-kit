/**
 * tRPC Client for platform package
 * @module platform/trpc/client
 */

export { TRPCClientFactory, createTRPCClientFactory } from './client-factory'
export type { TRPCClientConfig, TRPCClientOptions } from './client-factory'

/**
 * 默认tRPC客户端配置
 */
export const defaultTRPCConfig = {
  url: process.env.NEXT_PUBLIC_TRPC_URL || '/api/trpc',
  timeout: 30000,
  retries: 3,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
  },
}

/**
 * 创建默认tRPC客户端
 */
export function createDefaultTRPCClient() {
  const factory = createTRPCClientFactory(defaultTRPCConfig)
  return factory.createClient()
}