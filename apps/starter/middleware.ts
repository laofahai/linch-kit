import { NextRequest, NextResponse } from 'next/server'

// 使用简单的 JWT 解码（不验证签名）来获取基本信息
// 这样可以避免在 Edge Runtime 中使用 jsonwebtoken
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// 需要认证的路径
const PROTECTED_PATHS = [
  '/dashboard',
  '/admin',
  '/api/protected'
]

// 只有管理员能访问的路径
const ADMIN_PATHS = [
  '/admin'
]

// 认证相关路径
const AUTH_PATHS = [
  '/sign-in',
  '/sign-up',
  '/forgot-password'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 获取 token
  const token = request.cookies.get('auth-token')?.value
  
  // 检查是否是需要保护的路径
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path))
  
  // 如果是认证页面且已登录，重定向到首页
  if (isAuthPath && token) {
    const decoded = decodeJwt(token)
    if (decoded && decoded.exp * 1000 > Date.now()) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // 如果访问受保护的路径但没有 token，重定向到登录页
  if (isProtectedPath && !token) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // 如果有 token，验证有效性
  if (token) {
    const decoded = decodeJwt(token)
    
    if (decoded && decoded.exp * 1000 > Date.now()) {
      // Token 有效
      
      // 检查管理员权限
      if (isAdminPath) {
        const isAdmin = decoded.role === 'TENANT_ADMIN' || decoded.role === 'SUPER_ADMIN'
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
        }
      }
      
      // 在请求头中添加用户信息，供后续处理使用
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decoded.userId)
      requestHeaders.set('x-user-email', decoded.email)
      requestHeaders.set('x-user-role', decoded.role)
      // 对中文用户名进行 Base64 编码以避免 HTTP 头部编码问题
      requestHeaders.set('x-user-name', btoa(encodeURIComponent(decoded.name)))
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } else {
      // Token 过期或无效
      if (isProtectedPath) {
        const signInUrl = new URL('/sign-in', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        signInUrl.searchParams.set('error', 'token_expired')
        
        // 清除无效的 token
        const response = NextResponse.redirect(signInUrl)
        response.cookies.delete('auth-token')
        return response
      }
    }
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