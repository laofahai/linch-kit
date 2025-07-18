/**
 * 登录API端点
 */

import { createServerJWTAuthServiceFromEnv } from '@linch-kit/auth/server'
import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

// 创建认证服务实例（懒加载避免重复实例化）
let authService: ReturnType<typeof createServerJWTAuthServiceFromEnv> | null = null

function getAuthService() {
  authService ??= createServerJWTAuthServiceFromEnv({
    accessTokenExpiry: process.env['ACCESS_TOKEN_EXPIRY'] ?? '15m',
    refreshTokenExpiry: process.env['REFRESH_TOKEN_EXPIRY'] ?? '7d',
    algorithm: 'HS256',
    issuer: 'linch-kit-starter',
    audience: 'linch-kit-starter-app'
  })
  return authService
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()


    logger.info('用户登录请求', {
      service: 'login-api',
      email: email?.toString().slice(0, 3) + '***', // 脱敏信息
      hasPassword: !!password
    })

    const result = await getAuthService().authenticate({
      provider: 'credentials',
      credentials: {
        email,
        password
      }
    })

    if (result.success) {
      logger.info('用户登录成功', {
        service: 'login-api',
        userId: result.user?.id,
        email: email?.toString().slice(0, 3) + '***'
      })
    } else {
      logger.warn('用户登录失败', {
        service: 'login-api',
        email: email?.toString().slice(0, 3) + '***',
        error: result.error
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('登录API发生错误', error instanceof Error ? error : undefined, {
      service: 'login-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: '登录服务不可用，请稍后再试' },
      { status: 500 }
    )
  }
}