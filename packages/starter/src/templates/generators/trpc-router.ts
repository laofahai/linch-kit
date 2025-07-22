import type { StarterConfig } from '../../types'

/**
 * Generate tRPC router based on Starter config
 */
export function generateTrpcRouter(config: StarterConfig): string {
  if (!config.trpc.enabled) {
    return '// tRPC is disabled in configuration'
  }

  return `import { createTRPCRouter } from '@linch-kit/core/server'
import { authRouter } from '@linch-kit/auth/server'
import { platformRouter } from '@linch-kit/platform'
${config.extensions.map(ext => `import { ${ext}Router } from '@linch-kit/${ext}'`).join('\n')}

/**
 * LinchKit Starter tRPC Router
 * 自动生成的路由配置 - 基于 ${config.appName} v${config.version}
 */
export const appRouter = createTRPCRouter({
  // 认证路由
  ${config.auth.enabled ? `auth: authRouter,` : `// auth: authRouter, // 已禁用`}
  
  // 平台路由
  platform: platformRouter,
  
  // 扩展路由
${config.extensions.map(ext => `  ${ext}: ${ext}Router,`).join('\n')}
})

export type AppRouter = typeof appRouter`
}