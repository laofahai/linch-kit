import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Logger } from '@linch-kit/core'
import { z } from 'zod'

// 登录请求验证
const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

// JWT 密钥（生产环境应该从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'linchkit-dev-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export async function POST(request: NextRequest) {
  try {
    Logger.info('API: 开始处理登录请求')

    // 解析请求体
    const body = await request.json()
    Logger.info('API: 登录请求数据', { email: body.email })

    // 验证输入数据
    const validation = LoginSchema.safeParse(body)
    if (!validation.success) {
      Logger.warn('API: 登录请求验证失败', { errors: validation.error.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '输入数据无效',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      Logger.warn('API: 用户不存在', { email })
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: '邮箱或密码错误',
        },
        { status: 401 }
      )
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      Logger.warn('API: 用户账户被禁用', { email, status: user.status })
      return NextResponse.json(
        {
          success: false,
          error: 'ACCOUNT_DISABLED',
          message: '账户已被禁用，请联系管理员',
        },
        { status: 403 }
      )
    }

    // 验证密码
    if (!user.password) {
      Logger.warn('API: 用户密码为空', { email })
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      Logger.warn('API: 密码验证失败', { email })
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
        { status: 401 }
      )
    }

    // 生成 JWT Token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'linchkit',
      audience: 'linchkit-app',
    })

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // 创建会话记录（可选）
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: token.substring(0, 32), // 只存储 token 的前32位用于标识
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ipAddress:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      },
    })

    Logger.info('API: 用户登录成功', {
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    })

    // 准备响应数据
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || `https://avatar.vercel.sh/${encodeURIComponent(user.name)}`,
      role: user.role,
      status: user.status,
      emailVerified: !!user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }

    // 设置 HttpOnly Cookie
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: userData,
      expiresIn: JWT_EXPIRES_IN,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7天（秒）
      path: '/',
    })

    return response
  } catch (error) {
    Logger.error('API: 登录处理失败', error instanceof Error ? error : new Error(String(error)))

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '登录失败，请稍后重试',
      },
      { status: 500 }
    )
  }
}

// 处理 OPTIONS 请求（CORS 预检）
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
