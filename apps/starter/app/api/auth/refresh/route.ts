/**
 * Token刷新API端点 - 使用LinchKit Auth服务
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '../../../../lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()
    
    if (!refreshToken) {
      logger.warn('Token刷新请求缺少refreshToken', {
        service: 'refresh-api'
      })
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      )
    }
    
    logger.info('Token刷新请求', {
      service: 'refresh-api',
      tokenPrefix: refreshToken.slice(0, 10) + '...'
    })
    
    // 使用共享的认证服务验证并刷新token
    const authService = await getAuthService()
    
    try {
      // 使用正确的公共API方法刷新token
      const newSession = await authService.refreshToken(refreshToken)
      
      if (newSession) {
        logger.info('Token刷新成功', {
          service: 'refresh-api'
        })
        
        return NextResponse.json({
          success: true,
          tokens: {
            accessToken: newSession.accessToken,
            refreshToken: newSession.refreshToken
          }
        })
      } else {
        logger.warn('Token刷新失败 - refreshToken无效或已过期', {
          service: 'refresh-api'
        })
        
        return NextResponse.json(
          { success: false, error: 'Invalid or expired refresh token' },
          { status: 401 }
        )
      }
    } catch (tokenError) {
      logger.warn('Refresh token验证失败', {
        service: 'refresh-api',
        error: tokenError instanceof Error ? tokenError.message : String(tokenError)
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      )
    }
  } catch (error) {
    logger.error('Token刷新API发生错误', error instanceof Error ? error : undefined, {
      service: 'refresh-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: 'Token刷新服务不可用' },
      { status: 500 }
    )
  }
}