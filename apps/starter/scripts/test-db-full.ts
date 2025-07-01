import { config } from 'dotenv'
import { prisma } from '../src/lib/prisma.js'

// 加载环境变量
config({ path: '.env' })

async function testFullDatabaseFunctionality() {
  console.log('🚀 完整数据库功能测试开始...')
  
  try {
    // 1. 测试基本连接
    console.log('\n1. 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功!')

    // 2. 测试查询数据库版本
    console.log('\n2. 获取数据库信息...')
    const result = await prisma.$queryRaw`SELECT version()` as any[]
    console.log('✅ 数据库版本:', result[0]?.version?.substring(0, 50) + '...')

    // 3. 测试基本查询
    console.log('\n3. 测试基本查询...')
    const userCount = await prisma.user.count()
    const tenantCount = await prisma.tenant.count()
    const pluginCount = await prisma.plugin.count()
    console.log(`✅ 数据表状态:`)
    console.log(`  - 用户表: ${userCount} 条记录`)
    console.log(`  - 租户表: ${tenantCount} 条记录`)
    console.log(`  - 插件表: ${pluginCount} 条记录`)

    // 4. 测试创建租户
    console.log('\n4. 测试创建租户...')
    const testTenant = await prisma.tenant.create({
      data: {
        name: `Test Tenant ${Date.now()}`,
        slug: `test-tenant-${Date.now()}`,
        status: 'active',
        plan: 'free',
        description: 'Test tenant for database functionality verification'
      }
    })
    console.log('✅ 创建租户成功:', {
      id: testTenant.id,
      name: testTenant.name,
      slug: testTenant.slug,
      plan: testTenant.plan
    })

    // 5. 测试创建用户并关联租户
    console.log('\n5. 测试创建用户并关联租户...')
    const testUser = await prisma.user.create({
      data: {
        email: `test-user-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'ADMIN',
        tenantId: testTenant.id,
        status: 'active'
      }
    })
    console.log('✅ 创建用户成功:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      tenantId: testUser.tenantId
    })

    // 6. 测试创建租户配额
    console.log('\n6. 测试创建租户配额...')
    const testQuotas = await prisma.tenantQuotas.create({
      data: {
        tenantId: testTenant.id,
        maxUsers: 50,
        currentUsers: 1,
        maxStorage: BigInt(5 * 1024 * 1024 * 1024), // 5GB
        currentStorage: BigInt(0),
        maxApiCalls: 100000,
        currentApiCalls: 0,
        maxPlugins: 10,
        currentPlugins: 0,
        maxSchemas: 20,
        currentSchemas: 0
      }
    })
    console.log('✅ 创建租户配额成功:', {
      id: testQuotas.id,
      maxUsers: testQuotas.maxUsers,
      maxStorage: testQuotas.maxStorage.toString(),
      maxApiCalls: testQuotas.maxApiCalls
    })

    // 7. 测试创建插件
    console.log('\n7. 测试创建插件...')
    const testPlugin = await prisma.plugin.create({
      data: {
        name: 'test-plugin',
        version: '1.0.0',
        status: 'active',
        description: 'Test plugin for database functionality verification',
        config: JSON.stringify({ enabled: true, testMode: true })
      }
    })
    console.log('✅ 创建插件成功:', {
      id: testPlugin.id,
      name: testPlugin.name,
      version: testPlugin.version,
      status: testPlugin.status
    })

    // 8. 测试租户插件关联
    console.log('\n8. 测试租户插件关联...')
    const tenantPlugin = await prisma.tenantPlugin.create({
      data: {
        tenantId: testTenant.id,
        pluginId: testPlugin.id,
        status: 'active',
        config: JSON.stringify({ customSetting: 'test-value' })
      }
    })
    console.log('✅ 创建租户插件关联成功:', {
      id: tenantPlugin.id,
      tenantId: tenantPlugin.tenantId,
      pluginId: tenantPlugin.pluginId,
      status: tenantPlugin.status
    })

    // 9. 测试监控数据
    console.log('\n9. 测试监控数据...')
    const monitoringData = await prisma.monitoringData.create({
      data: {
        metric: 'test_metric',
        value: 42.5,
        tags: JSON.stringify({ environment: 'test', type: 'database_test' })
      }
    })
    console.log('✅ 创建监控数据成功:', {
      id: monitoringData.id,
      metric: monitoringData.metric,
      value: monitoringData.value
    })

    // 10. 测试关联查询
    console.log('\n10. 测试关联查询...')
    const tenantWithUsers = await prisma.tenant.findUnique({
      where: { id: testTenant.id },
      include: {
        users: true,
        quotas: true,
        plugins: {
          include: {
            plugin: true
          }
        }
      }
    })
    console.log('✅ 关联查询成功:', {
      tenant: tenantWithUsers?.name,
      usersCount: tenantWithUsers?.users.length,
      hasQuotas: !!tenantWithUsers?.quotas,
      pluginsCount: tenantWithUsers?.plugins.length
    })

    // 11. 测试事务
    console.log('\n11. 测试数据库事务...')
    const [secondTenant, secondUser] = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: `Transaction Tenant ${Date.now()}`,
          slug: `tx-tenant-${Date.now()}`,
          status: 'active',
          plan: 'starter'
        }
      })

      const newUser = await tx.user.create({
        data: {
          email: `tx-user-${Date.now()}@example.com`,
          name: 'Transaction User',
          role: 'USER',
          tenantId: newTenant.id,
          status: 'active'
        }
      })

      return [newTenant, newUser]
    })
    console.log('✅ 事务执行成功!')
    console.log('  - 创建租户:', secondTenant.name)
    console.log('  - 创建关联用户:', secondUser.email)

    // 12. 清理测试数据
    console.log('\n12. 清理测试数据...')
    await prisma.tenantPlugin.delete({ where: { id: tenantPlugin.id } })
    await prisma.tenantQuotas.delete({ where: { id: testQuotas.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    await prisma.user.delete({ where: { id: secondUser.id } })
    await prisma.tenant.delete({ where: { id: testTenant.id } })
    await prisma.tenant.delete({ where: { id: secondTenant.id } })
    await prisma.plugin.delete({ where: { id: testPlugin.id } })
    await prisma.monitoringData.delete({ where: { id: monitoringData.id } })
    console.log('✅ 测试数据清理完成!')

    console.log('\n🎉 完整数据库功能测试全部通过!')
    console.log('\n📊 测试结果汇总:')
    console.log('✅ 数据库连接 - 正常')
    console.log('✅ 基础 CRUD 操作 - 正常')
    console.log('✅ 关联关系 - 正常')
    console.log('✅ 外键约束 - 正常')
    console.log('✅ 事务处理 - 正常')
    console.log('✅ 复杂查询 - 正常')
    console.log('✅ 数据类型支持 - 正常')
    console.log('\n🔗 数据库配置:')
    console.log('- 提供商: PostgreSQL (Supabase)')
    console.log('- Prisma 版本: 6.10.1')
    console.log('- 连接方式: 直接连接 (端口 5432)')
    console.log('- 支持功能: 完整的 LinchKit 数据模型')

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    console.error('\n请检查:')
    console.error('1. DATABASE_URL 环境变量是否正确设置')
    console.error('2. Supabase 项目是否已启动')
    console.error('3. 数据库迁移是否已执行')
    console.error('4. 网络连接是否正常')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n👋 数据库连接已关闭')
  }
}

// 运行完整测试
testFullDatabaseFunctionality()