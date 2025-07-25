/**
 * 用户信息API端点 - 使用LinchKit Auth服务
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

function getUserFromToken(token: string) {
  // 简化的用户提取逻辑，在实际应用中应该验证JWT
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    
    const payload = JSON.parse(globalThis.atob(parts[1]))
    
    // 检查token是否过期
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }
    
    // 返回模拟用户数据
    return {
      id: payload.sub ?? 'user-123',
      email: payload.email ?? 'user@example.com',
      name: payload.name ?? 'Test User',
      avatar: payload.avatar ?? null
    }
  } catch {
    return null
  }
}

export function GET(request: NextRequest) {
  try {
    // 从Authorization头获取token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('用户信息请求缺少Authorization头', {
        service: 'user-api',
        hasAuth: !!authHeader
      })
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // 获取用户信息
    const user = getUserFromToken(token)
    if (!user) {
      logger.warn('无效的访问令牌', {
        service: 'user-api',
        tokenPrefix: token.slice(0, 10) + '...'
      })
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    logger.info('用户信息请求成功', {
      service: 'user-api',
      userId: user.id,
      email: user.email?.slice(0, 3) + '***'
    })
    
    return NextResponse.json(user)
  } catch (error) {
    logger.error('用户信息API发生错误', error instanceof Error ? error : undefined, {
      service: 'user-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: '用户信息服务不可用' },
      { status: 500 }
    )
  }
}