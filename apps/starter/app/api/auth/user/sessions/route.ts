/**
 * 用户会话管理API端点 - 使用完整的@linch-kit/auth服务实现
 * 提供用户会话查询和撤销功能，包含完整的JWT验证和数据库操作
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

    // 验证token
    const verifyResult = await authService.verifyToken(token)
    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 401 }
      )
    }

    // 获取用户所有会话
    const sessionsResult = await authService.getUserSessions(verifyResult.userId)

    if (!sessionsResult.success) {
      return NextResponse.json(
        { success: false, error: sessionsResult.error },
        { status: 400 }
      )
    }

    // 格式化会话信息
    const sessions = sessionsResult.sessions.map(session => ({
      id: session.id,
      isActive: session.isActive,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastAccessedAt: session.lastAccessedAt,
      deviceInfo: session.metadata?.deviceInfo || '未知设备',
      ipAddress: session.metadata?.ipAddress,
      userAgent: session.metadata?.userAgent,
      location: session.metadata?.location
    }))

    logger.info('用户会话信息获取成功', {
      service: 'user-sessions-api',
      userId: verifyResult.userId,
      sessionCount: sessions.length
    })

    return NextResponse.json({
      success: true,
      sessions
    })
  } catch (error) {
    logger.error('用户会话API发生错误', error instanceof Error ? error : undefined, {
      service: 'user-sessions-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { success: false, error: '获取会话信息失败' },
      { status: 500 }
    )
  }
}

// 撤销特定会话
export async function POST(request: NextRequest) {
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

    // 验证token
    const verifyResult = await authService.verifyToken(token)
    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 401 }
      )
    }

    // 获取请求体中的会话ID
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '缺少会话ID' },
        { status: 400 }
      )
    }

    // 撤销会话
    const revokeResult = await authService.revokeSession(sessionId, verifyResult.userId)

    if (!revokeResult.success) {
      return NextResponse.json(
        { success: false, error: revokeResult.error },
        { status: 400 }
      )
    }

    logger.info('用户会话撤销成功', {
      service: 'user-sessions-api',
      userId: verifyResult.userId,
      sessionId
    })

    return NextResponse.json({
      success: true,
      message: '会话已成功撤销'
    })
  } catch (error) {
    logger.error('撤销会话API发生错误', error instanceof Error ? error : undefined, {
      service: 'user-sessions-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { success: false, error: '撤销会话失败' },
      { status: 500 }
    )
  }
}