import { Logger } from '@linch-kit/core'
import { prisma } from '../prisma'
import type { User, Post } from '../schemas'
import bcrypt from 'bcryptjs'

// 数据服务类（真实数据库模式）
export class DataService {
  
  // 用户相关操作
  static async getUsers(): Promise<User[]> {
    try {
      Logger.info('DataService: 开始获取用户列表')
      
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
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
          updatedAt: true,
          // 不返回密码字段
        }
      })
      
      // 转换为应用层格式
      const appUsers: User[] = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || `https://avatar.vercel.sh/${user.name}`,
        role: (user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN') ? 'ADMIN' : 'USER',
        status: user.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      }))
      
      Logger.info('DataService: 用户列表获取成功', { count: appUsers.length })
      return appUsers
    } catch (error) {
      Logger.error('DataService: 用户列表获取失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  static async createUser(data: {
    email: string
    name: string
    avatar?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
    password?: string
  }) {
    try {
      Logger.info('DataService: 开始创建用户', { email: data.email })
      
      // 检查邮箱是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })
      
      if (existingUser) {
        throw new Error(`邮箱 ${data.email} 已被使用`)
      }
      
      // 生成默认密码或使用提供的密码
      const password = data.password || Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const dbUser = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          avatar: data.avatar || `https://avatar.vercel.sh/${encodeURIComponent(data.name)}`,
          role: data.role === 'ADMIN' ? 'TENANT_ADMIN' : 'USER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      })
      
      // 转换为应用层格式
      const user: User = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar || `https://avatar.vercel.sh/${dbUser.name}`,
        role: dbUser.role as 'USER' | 'ADMIN' | 'MODERATOR',
        status: dbUser.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
        lastLoginAt: dbUser.lastLoginAt?.toISOString() || null
      }
      
      Logger.info('DataService: 用户创建成功', { id: user.id })
      return user
    } catch (error) {
      Logger.error('DataService: 用户创建失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  // 文章相关操作  
  static async getPosts(): Promise<Post[]> {
    try {
      Logger.info('DataService: 开始获取文章列表')
      
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
      
      // 转换为应用层格式
      const appPosts: Post[] = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || post.content.substring(0, 100) + '...',
        authorId: post.authorId,
        tags: post.tags || [],
        status: post.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        publishedAt: post.publishedAt?.toISOString() || null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      }))
      
      Logger.info('DataService: 文章列表获取成功', { count: appPosts.length })
      return appPosts
    } catch (error) {
      Logger.error('DataService: 文章列表获取失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  static async createPost(data: {
    title: string
    content: string
    excerpt?: string
    authorId: string
    tags?: string[]
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  }) {
    try {
      Logger.info('DataService: 开始创建文章', { title: data.title })
      
      // 验证作者是否存在
      const author = await prisma.user.findUnique({
        where: { id: data.authorId }
      })
      
      if (!author) {
        throw new Error(`作者不存在: ${data.authorId}`)
      }
      
      const dbPost = await prisma.post.create({
        data: {
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || data.content.substring(0, 100) + '...',
          authorId: data.authorId,
          tags: data.tags || [],
          status: data.status || 'DRAFT',
          viewCount: 0,
          likeCount: 0,
          publishedAt: data.status === 'PUBLISHED' ? new Date() : null
        }
      })
      
      // 转换为应用层格式
      const post: Post = {
        id: dbPost.id,
        title: dbPost.title,
        content: dbPost.content,
        excerpt: dbPost.excerpt || dbPost.content.substring(0, 100) + '...',
        authorId: dbPost.authorId,
        tags: dbPost.tags || [],
        status: dbPost.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        viewCount: dbPost.viewCount || 0,
        likeCount: dbPost.likeCount || 0,
        publishedAt: dbPost.publishedAt?.toISOString() || null,
        createdAt: dbPost.createdAt.toISOString(),
        updatedAt: dbPost.updatedAt.toISOString()
      }
      
      Logger.info('DataService: 文章创建成功', { id: post.id })
      return post
    } catch (error) {
      Logger.error('DataService: 文章创建失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  // 统计数据
  static async getStats() {
    try {
      Logger.info('DataService: 开始获取统计数据')
      
      const [totalUsers, totalPosts, publishedPosts, draftPosts] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.post.count({ where: { status: 'PUBLISHED' } }),
        prisma.post.count({ where: { status: 'DRAFT' } })
      ])
      
      const stats = {
        totalUsers,
        totalPosts,
        publishedPosts,
        draftPosts,
        lastUpdated: new Date().toISOString()
      }

      Logger.info('DataService: 统计数据获取成功', stats)
      return stats
    } catch (error) {
      Logger.error('DataService: 统计数据获取失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  // 示例数据初始化
  static async initializeSampleData() {
    try {
      Logger.info('DataService: 开始初始化示例数据')
      
      // 检查是否已有数据
      const userCount = await prisma.user.count()
      if (userCount > 1) { // 如果除了管理员外还有其他用户，跳过初始化
        Logger.info('DataService: 已存在用户数据，跳过示例数据初始化')
        return { success: true, skipped: true }
      }
      
      // 获取现有管理员用户
      const adminUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      })
      
      if (!adminUser) {
        throw new Error('请先创建管理员账号')
      }
      
      // 创建示例用户
      const sampleUser = await this.createUser({
        email: 'user@linchkit.dev',
        name: '普通用户',
        role: 'USER',
        password: 'user123456'
      })

      // 创建示例文章
      const samplePosts = [
        {
          title: 'LinchKit 框架介绍',
          content: 'LinchKit 是一个 AI-First 的全栈开发框架，采用 Schema 驱动架构，提供端到端类型安全。它包含完整的企业级功能模块，支持多租户、权限控制、实时监控等特性。',
          excerpt: '了解 LinchKit 的核心特性和优势',
          authorId: adminUser.id,
          tags: ['linchkit', 'framework', 'ai'],
          status: 'PUBLISHED' as const
        },
        {
          title: 'Schema 驱动开发指南',
          content: '使用 @linch-kit/schema 实现类型安全的数据模型。Schema 驱动开发让你可以从单一的数据定义生成 TypeScript 类型、Prisma schema、验证规则和 UI 组件。',
          excerpt: '学习如何使用 Schema 驱动开发模式',
          authorId: adminUser.id,
          tags: ['schema', 'typescript', 'development'],
          status: 'PUBLISHED' as const
        },
        {
          title: 'CRUD 操作最佳实践',
          content: '@linch-kit/crud 提供了类型安全的数据操作接口，支持权限控制、数据验证、缓存等企业级功能。本文介绍如何正确使用 CRUD 操作。',
          excerpt: '掌握企业级 CRUD 操作的最佳实践',
          authorId: sampleUser.id,
          tags: ['crud', 'database', 'best-practices'],
          status: 'DRAFT' as const
        }
      ]

      for (const postData of samplePosts) {
        await this.createPost(postData)
      }

      Logger.info('DataService: 示例数据初始化完成')
      return { success: true }
    } catch (error) {
      Logger.error('DataService: 示例数据初始化失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }
}