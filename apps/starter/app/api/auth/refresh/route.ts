/**
 * Token 刷新 API 端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Logger } from '@linch-kit/core'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取 token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
    })

    if (!token) {
      return NextResponse.json(
        { error: '无效的认证令牌' },
        { status: 401 }
      )
    }

    // 检查 token 是否即将过期
    const currentTime = Math.floor(Date.now() / 1000)
    const tokenExp = token.exp || 0

    if (tokenExp - currentTime > 5 * 60) { // 如果还有超过5分钟才过期
      return NextResponse.json(
        { error: '令牌尚未需要刷新' },
        { status: 400 }
      )
    }

    // 获取当前会话
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '无效的会话' },
        { status: 401 }
      )
    }

    // 模拟生成新 token（实际应用中应该通过 NextAuth 的机制）
    const newToken = btoa(JSON.stringify({
      userId: session.user.id,
      email: session.user.email,
      role: (session as unknown as { roles?: string[] }).roles?.[0] || 'USER',
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30天
      iat: Math.floor(Date.now() / 1000)
    }))

    Logger.info('Token刷新成功', { 
      userId: session.user.id,
      email: session.user.email 
    })

    return NextResponse.json({
      success: true,
      token: newToken,
      expiresIn: 30 * 24 * 60 * 60, // 30天（秒）
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session as unknown as { roles?: string[] }).roles?.[0] || 'USER'
      }
    })

  } catch (error) {
    Logger.error('Token刷新失败', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: '刷新失败' },
      { status: 500 }
    )
  }
}

// 只允许 POST 方法
export async function GET() {
  return NextResponse.json(
    { error: '方法不允许' },
    { status: 405 }
  )
}