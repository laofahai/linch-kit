import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Logger } from '@linch-kit/core'

const JWT_SECRET = process.env.JWT_SECRET || 'linchkit-dev-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    Logger.info('API: 开始处理登出请求')

    // 获取 token
    const token = request.cookies.get('auth-token')?.value

    if (token) {
      try {
        // 解码 token 获取用户信息
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

        // 删除数据库中的会话记录
        await prisma.session.deleteMany({
          where: {
            userId: decoded.userId,
            token: token.substring(0, 32),
          },
        })

        Logger.info('API: 用户登出成功', { userId: decoded.userId })
      } catch (error) {
        Logger.warn('API: 登出时 token 验证失败', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 创建响应并清除 cookie
    const response = NextResponse.json({
      success: true,
      message: '登出成功',
    })

    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    Logger.error('API: 登出处理失败', error instanceof Error ? error : new Error(String(error)))

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '登出失败，请稍后重试',
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
