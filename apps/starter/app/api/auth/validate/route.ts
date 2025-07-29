/**
 * JWT令牌验证API端点
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

import { getAuthService } from '../../../../lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    // 获取Authorization头中的token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No valid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    logger.info('JWT令牌验证请求', {
      service: 'validate-api',
      hasToken: !!token
    })

    // 使用共享的JWT认证服务验证token
    const authService = await getAuthService()
    
    try {
      // 验证JWT token并获取session
      const session = await authService.validateSession(token)
      
      if (!session) {
        logger.warn('JWT token验证失败', {
          service: 'validate-api',
          reason: 'invalid_session'
        })
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      
      logger.info('JWT token验证成功', {
        service: 'validate-api',
        userId: session.id,
        sessionId: session.id
      })
      
      return NextResponse.json({
        valid: true,
        session: {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role
        }
      })
    } catch (jwtError) {
      logger.warn('JWT token验证失败', {
        service: 'validate-api',
        reason: 'jwt_verification_failed',
        error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
      })
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  } catch (error) {
    logger.error('JWT验证API发生错误', error instanceof Error ? error : undefined, {
      service: 'validate-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { error: 'Token validation service unavailable' },
      { status: 500 }
    )
  }
}