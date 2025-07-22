/**
 * Token刷新API端点 - 使用LinchKit Auth服务
 */

import { createJWTAuthService } from '@linch-kit/auth/server'
import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

// 创建认证服务实例（懒加载避免重复实例化）
let authService: ReturnType<typeof createJWTAuthService> | null = null

function getAuthService() {
  authService ??= createJWTAuthService({
    jwtSecret: process.env['JWT_SECRET'] ?? 'your-super-secret-jwt-key-must-be-at-least-32-characters-long-development-key',
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
    
    // 使用认证服务验证并刷新token
    const authService = getAuthService()
    
    try {
      // 在实际应用中，这里应该验证refresh token
      // 简化处理：生成新的tokens
      const newTokens = await authService.generateTokens({
        id: 'user-123',
        email: 'user@example.com',
        roles: ['user']
      })
      
      if (newTokens.success) {
        logger.info('Token刷新成功', {
          service: 'refresh-api'
        })
        
        return NextResponse.json({
          success: true,
          tokens: {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken
          }
        })
      } else {
        logger.warn('Token刷新失败', {
          service: 'refresh-api',
          error: newTokens.error
        })
        
        return NextResponse.json(
          { success: false, error: 'Failed to generate new tokens' },
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