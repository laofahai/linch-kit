/**
 * 认证中间件 - 使用@linch-kit/auth JWT认证
 * 
 * 提供统一的认证验证和会话管理
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * 认证中间件配置
 */
export interface AuthMiddlewareConfig {
  /**
   * 需要认证的路径模式
   */
  protectedPaths: string[]
  
  /**
   * 登录页面路径
   */
  loginPath: string
  
  /**
   * 公共路径（不需要认证）
   */
  publicPaths: string[]
  
  /**
   * API路径（需要特殊处理）
   */
  apiPaths: string[]
}

/**
 * 默认认证中间件配置
 */
const defaultConfig: AuthMiddlewareConfig = {
  protectedPaths: ['/dashboard', '/profile', '/settings'],
  loginPath: '/auth',
  publicPaths: ['/', '/auth', '/api/public'],
  apiPaths: ['/api']
}

/**
 * 检查路径是否匹配模式
 */
function matchPath(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1))
    }
    return path === pattern || path.startsWith(pattern + '/')
  })
}

/**
 * 获取会话令牌
 */
function getSessionToken(request: NextRequest): string | null {
  // 优先从Authorization头获取
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从Cookie获取
  const sessionCookie = request.cookies.get('session')
  if (sessionCookie?.value) {
    return sessionCookie.value
  }

  return null
}

/**
 * 认证中间件
 */
export async function authMiddleware(
  request: NextRequest,
  config: Partial<AuthMiddlewareConfig> = {}
): Promise<NextResponse> {
  const { protectedPaths, loginPath, publicPaths, apiPaths } = {
    ...defaultConfig,
    ...config
  }

  const { pathname } = request.nextUrl

  // 检查是否为公共路径
  if (matchPath(pathname, publicPaths)) {
    return NextResponse.next()
  }

  // 检查是否为受保护路径
  const isProtectedPath = matchPath(pathname, protectedPaths)
  const isApiPath = matchPath(pathname, apiPaths)

  if (!isProtectedPath && !isApiPath) {
    return NextResponse.next()
  }

  // 获取会话令牌
  const token = getSessionToken(request)

  if (!token) {
    if (isApiPath) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token provided' },
        { status: 401 }
      )
    }
    
    // 重定向到登录页面
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // 调用API路由验证JWT令牌
    const validateResponse = await fetch(new URL('/api/auth/validate', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!validateResponse.ok) {
      if (isApiPath) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired token' },
          { status: validateResponse.status }
        )
      }
      
      // 重定向到登录页面
      const loginUrl = new URL(loginPath, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { session } = await validateResponse.json()

    // 添加用户信息到请求头
    const response = NextResponse.next()
    response.headers.set('X-User-ID', session.userId)
    response.headers.set('X-Session-ID', session.id)

    return response
  } catch (error) {
    // 暂时使用console.error，后续根据项目logger规范进行替换
    // eslint-disable-next-line no-console
    console.error('认证中间件错误:', error)

    if (isApiPath) {
      return NextResponse.json(
        { error: 'Authentication Error', message: 'Failed to validate session' },
        { status: 500 }
      )
    }

    // 重定向到登录页面
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * 创建认证中间件的便捷函数
 */
export function createAuthMiddleware(config?: Partial<AuthMiddlewareConfig>) {
  return (request: NextRequest) => authMiddleware(request, config)
}

/**
 * 从请求头获取用户信息
 */
export function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('X-User-ID') ?? null
  const sessionId = request.headers.get('X-Session-ID') ?? null

  return userId ? { userId, sessionId } : null
}

/**
 * 验证API请求的认证状态
 */
export async function validateApiAuth(request: NextRequest) {
  const token = getSessionToken(request)

  if (!token) {
    return { valid: false, error: 'No authentication token provided' }
  }

  try {
    const validateResponse = await fetch(new URL('/api/auth/validate', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!validateResponse.ok) {
      return { valid: false, error: 'Invalid or expired token' }
    }

    const { session, user } = await validateResponse.json()

    return { 
      valid: true, 
      session, 
      user
    }
  } catch (error) {
    // 暂时使用console.error，后续根据项目logger规范进行替换
    // eslint-disable-next-line no-console
    console.error('Authentication validation failed:', error)
    return { valid: false, error: 'Authentication validation failed' }
  }
}