/**
 * 登出API端点 - 使用LinchKit Auth服务
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

export function POST(request: NextRequest) {
  try {
    // 从Authorization头获取token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    logger.info('用户登出请求', {
      service: 'logout-api',
      hasToken: !!token,
      tokenPrefix: token ? token.slice(0, 10) + '...' : null
    })
    
    // 在实际应用中，这里应该：
    // 1. 将token加入黑名单
    // 2. 清理服务端会话
    // 3. 通知其他服务用户已登出
    
    // 简化处理：直接返回成功
    logger.info('用户登出成功', {
      service: 'logout-api'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    logger.error('登出API发生错误', error instanceof Error ? error : undefined, {
      service: 'logout-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: '登出服务不可用' },
      { status: 500 }
    )
  }
}