/**
 * 平台tRPC路由工厂 - 扩展基础tRPC功能
 * @module platform/trpc/platform-router-factory
 */

import { initTRPC } from '@trpc/server'
import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 为Extension创建tRPC路由器
 */
export function createExtensionRouter(context: ExtensionContext) {
  const t = initTRPC.context<{ extension: ExtensionContext }>().create()

  return t.router({
    // Extension基础信息
    info: t.procedure.query(() => ({
      name: context.name,
      permissions: context.permissions,
      status: 'running',
    })),

    // Extension配置
    config: t.procedure.query(() => context.config),

    // Extension日志
    logs: t.procedure.query(() => {
      // 返回Extension日志（这里需要实现日志收集）
      return []
    }),
  })
}

/**
 * Extension感知的tRPC中间件
 */
export function extensionMiddleware(context: ExtensionContext) {
  const t = initTRPC.context<{ extension: ExtensionContext }>().create()

  return t.middleware(({ ctx, next }) => {
    // 注入Extension上下文
    return next({
      ctx: {
        ...ctx,
        extension: context,
      },
    })
  })
}