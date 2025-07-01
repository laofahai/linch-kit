import createMiddleware from 'next-intl/middleware'

// 创建国际化中间件
const intlMiddleware = createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'never', // 不在 URL 中显示 locale 前缀
  localeDetection: false  // 禁用自动 locale 检测，始终使用默认 locale
})

export default intlMiddleware

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}