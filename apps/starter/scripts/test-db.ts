#!/usr/bin/env tsx

/**
 * 测试数据库连接脚本
 */

import { testDatabaseConnection, prisma } from '../lib/prisma'
import { Logger } from '@linch-kit/core'

async function main() {
  console.log('🔍 LinchKit 数据库连接测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // 测试基本连接
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      throw new Error('数据库连接失败')
    }

    // 测试表创建情况
    console.log('\n📊 检查数据表...')

    const userCount = await prisma.user.count()
    const postCount = await prisma.post.count()
    const sessionCount = await prisma.session.count()
    const configCount = await prisma.config.count()

    console.log(`👥 用户表: ${userCount} 条记录`)
    console.log(`📝 文章表: ${postCount} 条记录`)
    console.log(`🔐 会话表: ${sessionCount} 条记录`)
    console.log(`⚙️  配置表: ${configCount} 条记录`)

    // 测试基本 CRUD 操作
    console.log('\n🧪 测试基本操作...')

    // 创建测试配置
    const testConfig = await prisma.config.upsert({
      where: { key: 'test_connection' },
      update: {
        value: new Date().toISOString(),
        description: '数据库连接测试时间戳',
      },
      create: {
        key: 'test_connection',
        value: new Date().toISOString(),
        type: 'STRING',
        category: 'system',
        description: '数据库连接测试时间戳',
        isPublic: false,
      },
    })

    console.log(`✅ 配置操作成功: ${testConfig.key} = ${testConfig.value}`)

    console.log('\n🎉 数据库测试完成!')
    console.log('数据库已准备就绪，可以开始开发认证系统。')
  } catch (error) {
    console.error('\n❌ 数据库测试失败:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  Logger.error('测试脚本执行失败', error instanceof Error ? error : new Error(String(error)))
  process.exit(1)
})
