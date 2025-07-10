import { NextResponse } from 'next/server'
import { Logger } from '@linch-kit/core'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 获取当前用户信息 - 使用NextAuth会话管理
 * 移除自定义JWT逻辑，使用@linch-kit/auth标准方法
 */
export async function GET() {
  try {
    Logger.info('API: 开始处理用户信息请求')

    // 使用NextAuth获取会话信息
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_SESSION',
          message: '未登录',
        },
        { status: 401 }
      )
    }

    // 从数据库获取最新用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      Logger.warn('API: 用户不存在', { userId: session.user.id })
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在',
        },
        { status: 404 }
      )
    }

    if (user.status !== 'ACTIVE') {
      Logger.warn('API: 用户账户被禁用', { userId: user.id, status: user.status })
      return NextResponse.json(
        {
          success: false,
          error: 'ACCOUNT_DISABLED',
          message: '账户已被禁用',
        },
        { status: 403 }
      )
    }

    // 使用标准转换函数准备用户数据
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || `https://avatar.vercel.sh/${encodeURIComponent(user.name)}`,
      role: user.role,
      status: user.status,
      emailVerified: !!user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    Logger.info('API: 用户信息获取成功', { userId: user.id })

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    Logger.error('API: 用户信息获取失败', error instanceof Error ? error : new Error(String(error)))

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '获取用户信息失败',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
