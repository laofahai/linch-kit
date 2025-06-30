import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

// 创建国际化中间件
const intlMiddleware = createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'as-needed'
})

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 简化中间件，目前只处理国际化
  // 认证通过客户端组件处理
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/api/((?!auth).*)',
  ],
}