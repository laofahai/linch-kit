import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * @description 创建 Prisma 客户端实例，配置连接池和日志
 * @since 2025-06-20
 */
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * @description 优雅关闭数据库连接
 * @since 2025-06-20
 */
process.on('beforeExit', async () => {
  await db.$disconnect()
})
