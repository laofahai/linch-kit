/**
 * 轻量级中间件 - 基础路由拦截
 * 只负责简单的路由重定向，认证逻辑由console extension处理
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 定义需要公开访问的路径（不需要认证的路径）
const publicPages = [
  '/auth',           // starter 的认证页面（使用@linch-kit/auth）
  '/',               // 首页
  // 未来可添加其他公开页面
  // '/register',
  // '/forgot-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 跳过静态资源
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/trpc')
  ) {
    return NextResponse.next()
  }

  // 检查是否为公开页面，如果是则直接放行
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))
  if (isPublicPage) {
    return NextResponse.next()
  }

  // 如果访问需要保护的路径，但没有认证信息，重定向到对应的认证页面
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/console')) {
    // 简单的会话检查 - 检查是否有认证cookie
    const hasSession = request.cookies.get('session') || request.cookies.get('next-auth.session-token')
    
    if (!hasSession) {
      const url = request.nextUrl.clone()
      // 重定向到 starter 的认证页面（使用@linch-kit/auth）
      url.pathname = '/auth'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// 最小配置
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/console/:path*'
  ],
}