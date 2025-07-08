/**
 * LinchKit Starter App - 数据库种子文件
 *
 * @description 初始化数据库数据，包括用户、分类、文章等示例数据
 * @author LinchKit Team
 * @since 0.1.0
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  PostStatus,
  ConfigType,
  AuditCategory,
  AuditSeverity,
} from './generated/client'

const prisma = new PrismaClient()

/**
 * 主种子函数
 */
async function main() {
  console.log('🌱 开始数据库种子...')

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 清理现有数据...')
    await prisma.auditLog.deleteMany()
    await prisma.postTag.deleteMany()
    await prisma.post.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    await prisma.config.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
  }

  // 创建用户
  console.log('👤 创建用户...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@linchkit.com',
      name: 'LinchKit Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  })

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@linchkit.com',
      name: 'Regular User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  })

  console.log(`✅ 创建了 ${2} 个用户`)

  // 创建分类
  console.log('📂 创建分类...')
  const techCategory = await prisma.category.create({
    data: {
      name: '技术',
      description: '技术相关文章',
      slug: 'tech',
    },
  })

  const _businessCategory = await prisma.category.create({
    data: {
      name: '商业',
      description: '商业相关文章',
      slug: 'business',
    },
  })

  const frontendCategory = await prisma.category.create({
    data: {
      name: '前端开发',
      description: '前端开发技术',
      slug: 'frontend',
      parentId: techCategory.id,
    },
  })

  console.log(`✅ 创建了 ${3} 个分类`)

  // 创建标签
  console.log('🏷️ 创建标签...')
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'TypeScript', color: '#3178c6' },
    }),
    prisma.tag.create({
      data: { name: 'React', color: '#61dafb' },
    }),
    prisma.tag.create({
      data: { name: 'Next.js', color: '#000000' },
    }),
    prisma.tag.create({
      data: { name: 'Prisma', color: '#2d3748' },
    }),
    prisma.tag.create({
      data: { name: 'LinchKit', color: '#6366f1' },
    }),
  ])

  console.log(`✅ 创建了 ${tags.length} 个标签`)

  // 创建文章
  console.log('📝 创建文章...')
  const post1 = await prisma.post.create({
    data: {
      title: 'LinchKit 快速入门指南',
      content: `# LinchKit 快速入门指南

LinchKit 是一个 AI-First 的全栈开发框架，专为企业级应用设计。

## 主要特性

- 🚀 Schema 驱动的代码生成
- 🔐 企业级认证和权限管理
- 📊 内置可观测性和监控
- 🌐 多租户支持
- 🎨 现代化 UI 组件库

## 快速开始

\`\`\`bash
npm create linchkit-app my-app
cd my-app
npm run dev
\`\`\`

开始你的 LinchKit 之旅吧！`,
      published: true,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: adminUser.id,
      categoryId: techCategory.id,
    },
  })

  const post2 = await prisma.post.create({
    data: {
      title: 'TypeScript 最佳实践',
      content: `# TypeScript 最佳实践

TypeScript 为 JavaScript 带来了类型安全，让我们的代码更加健壮。

## 核心原则

1. 严格模式配置
2. 明确的类型定义
3. 避免 any 类型
4. 合理使用泛型

## 示例代码

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
}

function createUser(data: Omit<User, 'id'>): User {
  return {
    id: crypto.randomUUID(),
    ...data
  }
}
\`\`\``,
      published: true,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: regularUser.id,
      categoryId: frontendCategory.id,
    },
  })

  console.log(`✅ 创建了 ${2} 篇文章`)

  // 创建文章标签关联
  console.log('🔗 创建文章标签关联...')
  await Promise.all([
    prisma.postTag.create({
      data: { postId: post1.id, tagId: tags[4].id }, // LinchKit
    }),
    prisma.postTag.create({
      data: { postId: post1.id, tagId: tags[0].id }, // TypeScript
    }),
    prisma.postTag.create({
      data: { postId: post2.id, tagId: tags[0].id }, // TypeScript
    }),
    prisma.postTag.create({
      data: { postId: post2.id, tagId: tags[1].id }, // React
    }),
  ])

  console.log(`✅ 创建了 ${4} 个文章标签关联`)

  // 创建系统配置
  console.log('⚙️ 创建系统配置...')
  await Promise.all([
    prisma.config.create({
      data: {
        key: 'site.title',
        value: 'LinchKit Starter App',
        type: ConfigType.STRING,
        description: '网站标题',
      },
    }),
    prisma.config.create({
      data: {
        key: 'site.description',
        value: 'AI-First 全栈开发框架演示应用',
        type: ConfigType.STRING,
        description: '网站描述',
      },
    }),
    prisma.config.create({
      data: {
        key: 'features.registration',
        value: 'true',
        type: ConfigType.BOOLEAN,
        description: '是否允许用户注册',
      },
    }),
    prisma.config.create({
      data: {
        key: 'limits.posts_per_page',
        value: '10',
        type: ConfigType.NUMBER,
        description: '每页文章数量',
      },
    }),
  ])

  console.log(`✅ 创建了 ${4} 个系统配置`)

  // 创建审计日志示例
  console.log('📋 创建审计日志...')
  await Promise.all([
    prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: adminUser.id,
        userId: adminUser.id,
        userEmail: adminUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        details: JSON.stringify({ method: 'email', success: true }),
        category: AuditCategory.SECURITY,
        severity: AuditSeverity.LOW,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'POST_CREATE',
        resource: 'Post',
        resourceId: post1.id,
        userId: adminUser.id,
        userEmail: adminUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Seed Script)',
        details: JSON.stringify({ title: post1.title, published: true }),
        category: AuditCategory.DATA,
        severity: AuditSeverity.LOW,
      },
    }),
  ])

  console.log(`✅ 创建了 ${2} 条审计日志`)

  console.log('🎉 数据库种子完成！')
  console.log('\n📊 数据统计:')
  console.log(`- 用户: ${await prisma.user.count()}`)
  console.log(`- 分类: ${await prisma.category.count()}`)
  console.log(`- 标签: ${await prisma.tag.count()}`)
  console.log(`- 文章: ${await prisma.post.count()}`)
  console.log(`- 配置: ${await prisma.config.count()}`)
  console.log(`- 审计日志: ${await prisma.auditLog.count()}`)
}

main()
  .catch(e => {
    console.error('❌ 种子执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
