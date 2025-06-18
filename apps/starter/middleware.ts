import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { PUBLIC_ROUTES, SIGN_IN_URL } from '@/_lib/constants'

// 更简单直接的中间件实现，避免复杂的组合逻辑
export default withAuth(
  function middleware(req) {
    console.log('Middleware running on path:', req.nextUrl.pathname)
    return NextResponse.next()
  },
  {
    callbacks: {
      // 重要: 这里决定哪些路径需要认证
      authorized: ({ req, token }) => {
        // 检查是否是公开路由，如果是则不需要认证
        const isPublicRoute = PUBLIC_ROUTES.some(route => req.nextUrl.pathname.startsWith(route))

        if (isPublicRoute) {
          return true // 公开路由直接通过，无需认证
        }

        // 非公开路由需要有令牌才能通过
        return !!token
      },
    },
    pages: {
      signIn: SIGN_IN_URL,
    },
  }
)

// 配置中间件适用的路径，排除静态资源
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
