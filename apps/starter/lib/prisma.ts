import { PrismaClient } from '@prisma/client'
import { Logger } from '@linch-kit/core'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 测试数据库连接
export async function testDatabaseConnection() {
  try {
    Logger.info('正在测试数据库连接...')
    await prisma.$connect()
    Logger.info('✅ 数据库连接成功')
    return true
  } catch (error) {
    Logger.error('❌ 数据库连接失败', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}