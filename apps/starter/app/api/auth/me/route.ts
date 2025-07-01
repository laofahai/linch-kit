import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Logger } from '@linch-kit/core'

const JWT_SECRET = process.env.JWT_SECRET || 'linchkit-dev-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    Logger.info('API: 开始处理用户信息请求')
    
    // 获取 token
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'NO_TOKEN',
        message: '未登录'
      }, { status: 401 })
    }
    
    try {
      // 验证 token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
      
      // 从数据库获取最新用户信息
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
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
          updatedAt: true
        }
      })
      
      if (!user) {
        Logger.warn('API: 用户不存在', { userId: decoded.userId })
        return NextResponse.json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在'
        }, { status: 404 })
      }
      
      if (user.status !== 'ACTIVE') {
        Logger.warn('API: 用户账户被禁用', { userId: user.id, status: user.status })
        return NextResponse.json({
          success: false,
          error: 'ACCOUNT_DISABLED',
          message: '账户已被禁用'
        }, { status: 403 })
      }
      
      // 准备用户数据
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
        updatedAt: user.updatedAt.toISOString()
      }
      
      Logger.info('API: 用户信息获取成功', { userId: user.id })
      
      return NextResponse.json({
        success: true,
        user: userData
      })
      
    } catch (jwtError) {
      Logger.warn('API: Token 验证失败', { error: jwtError instanceof Error ? jwtError.message : String(jwtError) })
      return NextResponse.json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token 无效或已过期'
      }, { status: 401 })
    }
    
  } catch (error) {
    Logger.error('API: 用户信息获取失败', 
      error instanceof Error ? error : new Error(String(error))
    )
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '获取用户信息失败'
    }, { status: 500 })
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