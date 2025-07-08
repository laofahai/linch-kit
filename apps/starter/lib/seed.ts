/**
 * 数据库种子数据脚本
 * 用于创建示例用户和测试数据
 */

import { db } from './db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('开始创建种子数据...')

  // 创建超级管理员
  const superAdmin = await db.user.upsert({
    where: { email: 'admin@linchkit.dev' },
    update: {},
    create: {
      email: 'admin@linchkit.dev',
      name: '超级管理员',
      password: await bcrypt.hash('admin123', 10),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  })

  // 创建租户管理员
  const tenantAdmin = await db.user.upsert({
    where: { email: 'tenant@linchkit.dev' },
    update: {},
    create: {
      email: 'tenant@linchkit.dev',
      name: '租户管理员',
      password: await bcrypt.hash('tenant123', 10),
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  })

  // 创建普通用户
  const user = await db.user.upsert({
    where: { email: 'user@linchkit.dev' },
    update: {},
    create: {
      email: 'user@linchkit.dev',
      name: '普通用户',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  })

  // 创建一些配置项
  await db.config.upsert({
    where: { key: 'app.name' },
    update: {},
    create: {
      key: 'app.name',
      value: 'LinchKit Starter',
      type: 'STRING',
      category: 'app',
      description: '应用名称',
      isPublic: true,
    },
  })

  await db.config.upsert({
    where: { key: 'app.version' },
    update: {},
    create: {
      key: 'app.version',
      value: '1.0.0',
      type: 'STRING',
      category: 'app',
      description: '应用版本',
      isPublic: true,
    },
  })

  console.log('种子数据创建完成！')
  console.log('- 超级管理员:', superAdmin.email)
  console.log('- 租户管理员:', tenantAdmin.email)
  console.log('- 普通用户:', user.email)
}

main()
  .catch(e => {
    console.error('创建种子数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
