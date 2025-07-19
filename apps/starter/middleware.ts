/**
 * JWT认证中间件 - 使用@linch-kit/auth JWT认证
 * 提供完整的JWT会话验证和管理
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from './lib/auth-middleware'

export async function middleware(request: NextRequest) {
  // 跳过静态资源
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/api/trpc')
  ) {
    return NextResponse.next()
  }

  // 使用JWT认证中间件
  return authMiddleware(request, {
    protectedPaths: ['/dashboard', '/console', '/profile', '/settings'],
    loginPath: '/auth',
    publicPaths: ['/', '/auth', '/api/public', '/api/health', '/api/auth/login', '/api/auth/register'],
    apiPaths: ['/api']
  })
}

// 配置中间件匹配路径
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}