import { NextResponse, type NextRequest } from 'next/server'
import { PUBLIC_ROUTES, SIGN_IN_URL } from '@/_lib/constants'
// 使用 next-auth/jwt 的 getToken 代替 getSessionUser
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 防止重定向循环：如果已经在登录页面，直接通过
  if (pathname === SIGN_IN_URL) {
    return NextResponse.next()
  }

  // 跳过公开路由和API路由
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // 使用 getToken 替代 getSessionUser
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // 未认证用户重定向到登录页
    if (!token) {
      const loginUrl = new URL(SIGN_IN_URL, request.url)
      if (pathname) {
        loginUrl.searchParams.set('redirect', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    // 检查权限（示例：访问设置页面需要admin权限）
    if (pathname.startsWith('/settings')) {
      const permissions = (token.permissions as string[]) || []
      const hasPermission = permissions.includes('admin')
      if (!hasPermission) {
        return NextResponse.redirect(new URL('/403', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // 发生错误时，安全地继续处理请求
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
