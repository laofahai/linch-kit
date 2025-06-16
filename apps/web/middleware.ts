import { NextResponse, type NextRequest } from 'next/server';
import { checkPermission, getSessionUser } from '@/_lib/auth'

const PUBLIC_ROUTES = ['/login', '/callback', '/api/trpc'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过公开路由和API路由
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 获取当前用户
  const user = await getSessionUser();

  // 未认证用户重定向到登录页
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 检查权限（示例：访问设置页面需要admin权限）
  if (pathname.startsWith('/settings')) {
    const hasPermission = await checkPermission('admin');
    if (!hasPermission) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};