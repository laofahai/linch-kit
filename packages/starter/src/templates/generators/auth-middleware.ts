import type { StarterConfig } from '../../types'

/**
 * Generate authentication middleware based on Starter config
 */
export function generateAuthMiddleware(config: StarterConfig): string {
  if (!config.auth.enabled) {
    return `// 认证已禁用
export { middleware } from '@linch-kit/core/server'`
  }

  return `import { createMiddleware } from '@linch-kit/auth/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * LinchKit Starter 认证中间件
 * 提供商: ${config.auth.provider}
 * 应用: ${config.appName}
 */
export const middleware = createMiddleware({
  provider: '${config.auth.provider}',
  
  // 受保护的路由
  protectedPaths: [
    '/dashboard',
    '/admin',
    '/api/protected',
  ],
  
  // 公开路由
  publicPaths: [
    '/',
    '/auth',
    '/api/auth',
  ],
  
  // 登录重定向
  signInUrl: '/auth/login',
  
  // 扩展集成
  extensions: ${JSON.stringify(config.extensions, null, 2)},
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}`
}