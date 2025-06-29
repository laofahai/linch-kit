/**
 * 数据库种子脚本
 * 
 * 创建测试租户和用户数据
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建种子数据...')

  // 创建测试租户
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: '演示公司',
      slug: 'demo-company',
      description: '这是一个演示租户',
      status: 'active',
      plan: 'professional',
      maxUsers: 50,
      maxStorage: BigInt(5 * 1024 * 1024 * 1024), // 5GB
    }
  })

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'startup-inc' },
    update: {},
    create: {
      name: 'Startup Inc',
      slug: 'startup-inc',
      description: '初创公司',
      status: 'active',
      plan: 'starter',
      maxUsers: 10,
      maxStorage: BigInt(1024 * 1024 * 1024), // 1GB
    }
  })

  // 创建配额记录
  await prisma.tenantQuotas.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      maxUsers: tenant1.maxUsers,
      currentUsers: 2,
      maxStorage: tenant1.maxStorage,
      currentStorage: BigInt(100 * 1024 * 1024), // 100MB
      maxApiCalls: 50000,
      currentApiCalls: 1200,
      maxPlugins: 10,
      currentPlugins: 3,
      maxSchemas: 20,
      currentSchemas: 5,
    }
  })

  await prisma.tenantQuotas.upsert({
    where: { tenantId: tenant2.id },
    update: {},
    create: {
      tenantId: tenant2.id,
      maxUsers: tenant2.maxUsers,
      currentUsers: 1,
      maxStorage: tenant2.maxStorage,
      currentStorage: BigInt(50 * 1024 * 1024), // 50MB
      maxApiCalls: 10000,
      currentApiCalls: 300,
      maxPlugins: 5,
      currentPlugins: 1,
      maxSchemas: 10,
      currentSchemas: 2,
    }
  })

  // 创建测试用户
  await prisma.user.upsert({
    where: { email: 'admin@demo-company.com' },
    update: {},
    create: {
      email: 'admin@demo-company.com',
      name: '管理员',
      role: 'ADMIN',
      tenantId: tenant1.id,
      status: 'active',
    }
  })

  await prisma.user.upsert({
    where: { email: 'user@demo-company.com' },
    update: {},
    create: {
      email: 'user@demo-company.com',
      name: '普通用户',
      role: 'USER',
      tenantId: tenant1.id,
      status: 'active',
    }
  })

  await prisma.user.upsert({
    where: { email: 'founder@startup-inc.com' },
    update: {},
    create: {
      email: 'founder@startup-inc.com',
      name: '创始人',
      role: 'ADMIN',
      tenantId: tenant2.id,
      status: 'active',
    }
  })

  console.log('种子数据创建完成！')
  console.log(`租户 1: ${tenant1.name} (${tenant1.slug})`)
  console.log(`租户 2: ${tenant2.name} (${tenant2.slug})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })