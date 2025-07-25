/**
 * 登录API端点 - 使用LinchKit Auth新架构
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

import { getAuthService } from '../../../../lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    logger.info('用户登录请求', {
      service: 'login-api',
      email: email?.toString().slice(0, 3) + '***', // 脱敏信息
      hasPassword: !!password
    })

    // 使用共享的认证服务
    const authService = await getAuthService()
    
    // 构造认证请求
    const authRequest = {
      provider: 'credentials',
      credentials: {
        email,
        password
      }
    }
    
    // 使用认证服务进行身份验证
    const result = await authService.authenticate(authRequest)

    if (result.success && result.user) {
      logger.info('用户登录成功', {
        service: 'login-api',
        userId: result.user.id,
        email: email?.toString().slice(0, 3) + '***'
      })
      
      return NextResponse.json(result)
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

