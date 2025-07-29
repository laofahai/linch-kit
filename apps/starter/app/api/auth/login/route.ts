/**
 * 登录API端点 - 使用完整的@linch-kit/auth服务实现
 * 提供用户登录功能，支持邮箱和密码认证，包含完整的JWT和数据库集成
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '../../../../lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    logger.info('用户登录请求', {
      service: 'login-api',
      email: email?.toString().slice(0, 3) + '***', // 脱敏信息
      hasPassword: !!password
    })

    // 基础验证
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 获取认证服务
    const authService = getAuthService()

    // 用户登录
    const loginResult = await authService.login(email, password, {
      metadata: {
        loginIp: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        rememberMe: Boolean(rememberMe)
      }
    })

    if (loginResult.success) {
      const { user, tokens, session } = loginResult

      logger.info('用户登录成功', {
        service: 'login-api',
        userId: user.id,
        email: user.email,
        sessionId: session.id
      })

      // 设置认证cookie
      const response = NextResponse.json({
        success: true,
        message: '登录成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        },
        accessToken: tokens.accessToken,
        expiresIn: 15 * 60, // 15分钟
        refreshToken: tokens.refreshToken
      })

      // 设置HTTP-only cookie for access token
      response.cookies.set('auth-token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15分钟
        path: '/'
      })

      // 设置HTTP-only cookie for refresh token
      response.cookies.set('refresh-token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7天或1天
        path: '/'
      })

      return response
    } else {
      logger.warn('用户登录失败', {
        service: 'login-api',
        email: email?.toString().slice(0, 3) + '***',
        error: loginResult.error
      })

      return NextResponse.json(
        { success: false, error: loginResult.error },
        { status: 401 }
      )
    }
  } catch (error) {
    logger.error('登录API发生错误', error instanceof Error ? error : undefined, {
      service: 'login-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { success: false, error: '登录服务不可用，请稍后再试' },
      { status: 500 }
    )
  }
}

