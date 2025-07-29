/**
 * 撤销特定会话的API端点
 */

import { getAuthService, getPrismaClient } from '../../../../../lib/auth-service'
import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
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

    // 使用认证服务验证token
    const authService = await getAuthService()
    const validationResult = await authService.validateToken(token)

    if (!validationResult.success || !validationResult.user) {
      return NextResponse.json(
        { success: false, error: '无效的认证令牌' },
        { status: 401 }
      )
    }

    const sessionId = context.params.sessionId

    // 撤销指定会话
    const prisma = getPrismaClient()
    const session = await prisma.session.updateMany({
      where: {
        id: sessionId,
        userId: validationResult.user.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    if (session.count === 0) {
      return NextResponse.json(
        { success: false, error: '会话不存在或已被撤销' },
        { status: 404 }
      )
    }

    logger.info('用户会话撤销成功', {
      service: 'revoke-session-api',
      userId: validationResult.user.id,
      sessionId
    })

    return NextResponse.json({
      success: true,
      message: '会话已成功撤销'
    })
  } catch (error) {
    logger.error('撤销会话API发生错误', error instanceof Error ? error : undefined, {
      service: 'revoke-session-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: '撤销会话失败' },
      { status: 500 }
    )
  }
}