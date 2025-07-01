#!/usr/bin/env tsx

/**
 * 重置数据库 - 删除所有表
 */

import { prisma } from '../lib/prisma'
import { Logger } from '@linch-kit/core'

async function resetDatabase() {
  try {
    console.log('🗑️  开始删除所有数据库表...')
    
    // 删除所有表（按依赖顺序）
    await prisma.$executeRaw`DROP TABLE IF EXISTS "audit_logs" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "configs" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "sessions" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "posts" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "users" CASCADE;`
    
    // 删除枚举类型
    await prisma.$executeRaw`DROP TYPE IF EXISTS "UserRole" CASCADE;`
    await prisma.$executeRaw`DROP TYPE IF EXISTS "UserStatus" CASCADE;`
    await prisma.$executeRaw`DROP TYPE IF EXISTS "PostStatus" CASCADE;`
    await prisma.$executeRaw`DROP TYPE IF EXISTS "ConfigType" CASCADE;`
    
    console.log('✅ 所有表已删除')
    
  } catch (error) {
    Logger.error('删除表失败', error instanceof Error ? error : new Error(String(error)))
    console.error('❌ 删除表失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()