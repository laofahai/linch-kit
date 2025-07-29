/**
 * 用户注册API端点 - 使用完整的@linch-kit/auth服务实现
 * 提供用户注册功能，支持邮箱和密码认证，包含完整的JWT和数据库集成
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@linch-kit/core/server'
import { getAuthService } from '../../../../lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // 基础验证
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }

    // 密码强度验证
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: '密码长度至少为8位' },
        { status: 400 }
      )
    }

    // 密码复杂度验证
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { 
          success: false, 
          error: '密码必须包含大小写字母、数字和特殊字符' 
        },
        { status: 400 }
      )
    }

    // 获取认证服务
    const authService = getAuthService()

    // 注册新用户
    const registerResult = await authService.register({
      email,
      password,
      name: name || email.split('@')[0],
      metadata: { 
        source: 'starter-app',
        registrationIp: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    if (registerResult.success) {
      const { user, tokens } = registerResult

      logger.info('用户注册成功', {
        service: 'auth-api',
        userId: user.id,
        email: user.email,
        name: user.name
      })

      // 设置认证cookie
      const response = NextResponse.json({
        success: true,
        message: '注册成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          createdAt: user.createdAt
        },
        accessToken: tokens.accessToken,
        expiresIn: 15 * 60 // 15分钟
      })

      // 设置HTTP-only cookie
      response.cookies.set('auth-token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15分钟
        path: '/'
      })

      // 设置refresh token cookie
      response.cookies.set('refresh-token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7天
        path: '/'
      })

      return response
    } else {
      logger.warn('用户注册失败', {
        service: 'auth-api',
        email,
        error: registerResult.error
      })

      return NextResponse.json(
        { success: false, error: registerResult.error },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error('用户注册失败', error instanceof Error ? error : undefined, {
      service: 'auth-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      { success: false, error: '注册过程中发生错误，请稍后重试' },
      { status: 500 }
    )
  }
}