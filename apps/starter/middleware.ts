import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 不需要认证的路径（公开路径）
const PUBLIC_PATHS = [
  '/',  // 首页
  '/sign-in',
  '/sign-up', 
  '/forgot-password'
]

// 只有管理员能访问的路径（已移除admin路由）
const ADMIN_PATHS: string[] = []

// 认证相关路径
const AUTH_PATHS = [
  '/sign-in',
  '/sign-up',
  '/forgot-password'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 使用 NextAuth.js 获取 token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
  })
  
  // 检查路径类型
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path))
  const isProtectedPath = !isPublicPath && !pathname.startsWith('/api/auth')
  
  // 如果是认证页面且已登录，重定向到首页
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 如果访问受保护路径但未登录，重定向到登录页
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  // 如果有 token，验证权限
  if (token) {
    // 检查管理员权限
    if (isAdminPath) {
      const userRole = token.role as string || 'USER'
      const isAdmin = userRole === 'TENANT_ADMIN' || userRole === 'SUPER_ADMIN'
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
      }
    }
    
    // 在请求头中添加用户信息，供后续处理使用
    const requestHeaders = new Headers(request.headers)
    if (token.sub) requestHeaders.set('x-user-id', token.sub)
    if (token.email) requestHeaders.set('x-user-email', token.email)
    if (token.role) requestHeaders.set('x-user-role', token.role as string)
    if (token.name) {
      // 对中文用户名进行 Base64 编码以避免 HTTP 头部编码问题
      requestHeaders.set('x-user-name', btoa(encodeURIComponent(token.name)))
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api/auth/* (认证相关 API)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (图标)
     * - public 文件夹中的文件
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}