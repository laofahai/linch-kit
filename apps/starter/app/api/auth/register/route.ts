/**
 * 用户注册API端点 - 使用LinchKit Auth新架构
 */

import { createDatabaseAuthService, createPrismaAdapter } from '@linch-kit/auth'
import { PrismaClient } from '../../../../prisma/generated/client'
import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'

// 全局实例（避免重复创建）
let prisma: PrismaClient | null = null
let databaseAuthService: ReturnType<typeof createDatabaseAuthService> | null = null

function getDatabaseAuthService() {
  if (!databaseAuthService) {
    // 创建 Prisma 客户端
    prisma = new PrismaClient()
    
    // 创建 Prisma 适配器
    const prismaAdapter = createPrismaAdapter(prisma)
    
    // 创建数据库认证服务
    databaseAuthService = createDatabaseAuthService({
      databaseAdapter: prismaAdapter,
      saltRounds: 12,
      enableSessionTracking: true
    })

    logger.info('数据库认证服务初始化完成', {
      service: 'database-auth-service-factory',
      hasSessionTracking: true
    })
  }
  return databaseAuthService
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    logger.info('用户注册请求', {
      service: 'register-api',
      email: email?.toString().slice(0, 3) + '***',
      hasPassword: !!password,
      hasName: !!name
    })

    // 基本验证
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    // 密码强度验证
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度至少6位' },
        { status: 400 }
      )
    }

    // 使用新架构的数据库认证服务进行注册
    const authService = getDatabaseAuthService()
    const result = await authService.register(email, password, name)

    if (result.success && result.user) {
      logger.info('用户注册成功', {
        service: 'register-api',
        userId: result.user.id,
        email: email.slice(0, 3) + '***'
      })

      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name
        },
        message: '注册成功'
      })
    } else {
      logger.warn('用户注册失败', {
        service: 'register-api',
        email: email.slice(0, 3) + '***',
        error: result.error
      })

      return NextResponse.json(
        { success: false, error: result.error || '注册失败' },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error('注册API发生错误', error instanceof Error ? error : undefined, {
      service: 'register-api',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { success: false, error: '注册服务不可用，请稍后再试' },
      { status: 500 }
    )
  }
}

// 优雅关闭时清理资源 
process.on('SIGTERM', async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
})