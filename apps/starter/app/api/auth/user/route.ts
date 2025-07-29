/**
 * 获取当前用户信息的API端点 - 使用完整的@linch-kit/auth服务实现
 * 通过JWT验证获取真实的用户信息
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '../../../../lib/auth-service'

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取Authorization token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌' },
        { status: 401 }
      )
    }

    // 获取认证服务
    const authService = getAuthService()

    // 使用完整的认证服务验证token
    const verifyResult = await authService.verifyToken(token)

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 401 }
      )
    }

    // 从数据库获取完整的用户信息
    const userResult = await authService.getUserById(verifyResult.userId)

    if (!userResult.success) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    const user = userResult.user

    logger.info('用户信息获取成功', {
      service: 'user-api',
      userId: user.id,
      email: user.email
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        updatedAt: user.updatedAt,
        metadata: user.metadata
      }
    })
  } catch (error) {
    logger.error('用户信息API发生错误', error instanceof Error ? error : undefined, {
      service: 'user-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}