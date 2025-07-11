/**
 * 数据服务层 - 使用 @linch-kit/platform CRUD
 * 重构为使用 LinchKit 平台工厂模式
 */

import { Logger } from '@linch-kit/core'
import { createCRUD } from '@linch-kit/platform'
import { UserSchema } from '@linch-kit/auth'

import { PostEntity } from '../schemas'
import type { User, Post } from '../schemas'

/**
 * 创建 CRUD 管理器
 * 注意：需要Extension上下文，这里使用简化的配置
 */
const logger = new Logger('DataService')

// 简化的Extension上下文
const extensionContext = {
  logger,
  events: {
    emit: async (event: string, data: unknown) => {
      logger.info(`Event: ${event}`, data)
    },
    on: () => {
      // 简化实现
    },
  },
}

const userCRUD = createCRUD({
  entityName: 'User',
  schema: UserSchema,
  extensionContext,
})

const postCRUD = createCRUD({
  entityName: 'Post',
  schema: PostEntity.zodSchema,
  extensionContext,
})

/**
 * 数据服务类 - 基于 LinchKit Platform CRUD
 */
export class DataService {
  /**
   * 获取用户列表
   */
  static async getUsers(): Promise<User[]> {
    try {
      Logger.info('DataService: 开始获取用户列表')

      const result = await userCRUD.findMany({
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        select: ['id', 'email', 'name', 'image', 'status', 'lastLoginAt', 'createdAt', 'updatedAt'],
      })

      if (!result.success || !result.data) {
        throw new Error('Failed to fetch users')
      }

      // 转换为应用层格式
      const appUsers: User[] = result.data.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || '',
        avatar: user.image || `https://avatar.vercel.sh/${user.name}`,
        role: (user.metadata?.role as 'USER' | 'ADMIN' | 'MODERATOR') || 'USER',
        status: (user.status?.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
      }))

      Logger.info('DataService: 用户列表获取成功', { count: appUsers.length })
      return appUsers
    } catch (error) {
      Logger.error(
        'DataService: 用户列表获取失败',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  /**
   * 创建用户
   */
  static async createUser(data: {
    email: string
    name: string
    avatar?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
    password?: string
  }): Promise<User> {
    try {
      Logger.info('DataService: 开始创建用户', { email: data.email })

      // 检查邮箱是否已存在
      const existingResult = await userCRUD.findFirst({
        where: { email: data.email },
      })

      if (existingResult.success && existingResult.data) {
        throw new Error(`邮箱 ${data.email} 已被使用`)
      }

      // 创建用户数据
      const userData = {
        email: data.email,
        name: data.name,
        image: data.avatar || `https://avatar.vercel.sh/${encodeURIComponent(data.name)}`,
        status: 'active' as const,
        metadata: {
          role: data.role || 'USER',
        },
      }

      const result = await userCRUD.create(userData)

      if (!result.success || !result.data) {
        throw new Error('Failed to create user')
      }

      // 转换为应用层格式
      const user: User = {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name || '',
        avatar: result.data.image || `https://avatar.vercel.sh/${result.data.name}`,
        role: (result.data.metadata?.role as 'USER' | 'ADMIN' | 'MODERATOR') || 'USER',
        status:
          (result.data.status?.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
        createdAt: result.data.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: result.data.updatedAt?.toISOString() || new Date().toISOString(),
        lastLoginAt: result.data.lastLoginAt?.toISOString() || null,
      }

      Logger.info('DataService: 用户创建成功', { id: user.id })
      return user
    } catch (error) {
      Logger.error(
        'DataService: 用户创建失败',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  /**
   * 获取文章列表
   */
  static async getPosts(): Promise<Post[]> {
    try {
      Logger.info('DataService: 开始获取文章列表')

      const result = await postCRUD.findMany({
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        include: ['author'],
      })

      if (!result.success || !result.data) {
        throw new Error('Failed to fetch posts')
      }

      // 转换为应用层格式
      const appPosts: Post[] = result.data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || post.content.substring(0, 100) + '...',
        authorId: post.authorId,
        tags: post.tags || [],
        status: post.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        publishedAt: post.publishedAt || null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }))

      Logger.info('DataService: 文章列表获取成功', { count: appPosts.length })
      return appPosts
    } catch (error) {
      Logger.error(
        'DataService: 文章列表获取失败',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  /**
   * 创建文章
   */
  static async createPost(data: {
    title: string
    content: string
    excerpt?: string
    authorId: string
    tags?: string[]
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  }): Promise<Post> {
    try {
      Logger.info('DataService: 开始创建文章', { title: data.title })

      // 验证作者是否存在
      const authorResult = await userCRUD.findById(data.authorId)

      if (!authorResult.success || !authorResult.data) {
        throw new Error(`作者不存在: ${data.authorId}`)
      }

      const postData = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 100) + '...',
        authorId: data.authorId,
        tags: data.tags || [],
        status: data.status || 'DRAFT',
        viewCount: 0,
        likeCount: 0,
        publishedAt: data.status === 'PUBLISHED' ? new Date().toISOString() : null,
      }

      const result = await postCRUD.create(postData)

      if (!result.success || !result.data) {
        throw new Error('Failed to create post')
      }

      // 转换为应用层格式
      const post: Post = {
        id: result.data.id,
        title: result.data.title,
        content: result.data.content,
        excerpt: result.data.excerpt || result.data.content.substring(0, 100) + '...',
        authorId: result.data.authorId,
        tags: result.data.tags || [],
        status: result.data.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        viewCount: result.data.viewCount || 0,
        likeCount: result.data.likeCount || 0,
        publishedAt: result.data.publishedAt || null,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      }

      Logger.info('DataService: 文章创建成功', { id: post.id })
      return post
    } catch (error) {
      Logger.error(
        'DataService: 文章创建失败',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  /**
   * 获取统计数据
   */
  static async getStats() {
    try {
      Logger.info('DataService: 开始获取统计数据')

      const [userCountResult, postCountResult, publishedPostsResult, activeUsersResult] =
        await Promise.all([
          userCRUD.count(),
          postCRUD.count(),
          postCRUD.count({ where: { status: 'PUBLISHED' } }),
          userCRUD.count({ where: { status: 'active' } }),
        ])

      const stats = {
        totalUsers: userCountResult.success ? userCountResult.data || 0 : 0,
        activeUsers: activeUsersResult.success ? activeUsersResult.data || 0 : 0,
        totalPosts: postCountResult.success ? postCountResult.data || 0 : 0,
        publishedPosts: publishedPostsResult.success ? publishedPostsResult.data || 0 : 0,
        lastUpdated: new Date().toISOString(),
      }

      Logger.info('DataService: 统计数据获取成功', stats)
      return stats
    } catch (error) {
      Logger.error(
        'DataService: 统计数据获取失败',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  /**
   * 示例数据初始化
   */
  static async initializeSampleData() {
    try {
      Logger.info('DataService: 开始初始化示例数据')

      // 检查是否已有数据
      const userCountResult = await userCRUD.count()
      const totalUsers = userCountResult.success ? userCountResult.data || 0 : 0

      if (totalUsers > 1) {
        Logger.info('DataService: 已存在用户数据，跳过示例数据初始化')
        return { success: true, skipped: true }
      }

      // 获取现有管理员用户
      const adminResult = await userCRUD.findFirst({
        where: { metadata: { role: 'ADMIN' } },
      })

      if (!adminResult.success || !adminResult.data) {
        throw new Error('请先创建管理员账号')
      }

      const adminUser = adminResult.data

      // 创建示例用户
      const sampleUser = await this.createUser({
        email: 'user@linchkit.dev',
        name: '普通用户',
        role: 'USER',
        password: 'user123456',
      })

      // 创建示例文章
      const samplePosts = [
        {
          title: 'LinchKit 框架介绍',
          content:
            'LinchKit 是一个 AI-First 的全栈开发框架，采用 Schema 驱动架构，提供端到端类型安全。它包含完整的企业级功能模块，支持多租户、权限控制、实时监控等特性。',
          excerpt: '了解 LinchKit 的核心特性和优势',
          authorId: adminUser.id,
          tags: ['linchkit', 'framework', 'ai'],
          status: 'PUBLISHED' as const,
        },
        {
          title: 'Schema 驱动开发指南',
          content:
            '使用 @linch-kit/schema 实现类型安全的数据模型。Schema 驱动开发让你可以从单一的数据定义生成 TypeScript 类型、Prisma schema、验证规则和 UI 组件。',
          excerpt: '学习如何使用 Schema 驱动开发模式',
          authorId: adminUser.id,
          tags: ['schema', 'typescript', 'development'],
          status: 'PUBLISHED' as const,
        },
        {
          title: 'CRUD 操作最佳实践',
          content:
            '@linch-kit/crud 提供了类型安全的数据操作接口，支持权限控制、数据验证、缓存等企业级功能。本文介绍如何正确使用 CRUD 操作。',
          excerpt: '掌握企业级 CRUD 操作的最佳实践',
          authorId: sampleUser.id,
          tags: ['crud', 'database', 'best-practices'],
          status: 'DRAFT' as const,
        },
      ]

      for (const postData of samplePosts) {
        await this.createPost(postData)
      }

      Logger.info('DataService: 示例数据初始化完成')
      return { success: true }
    } catch (error) {
      Logger.error(
        'DataService: 示例数据初始化失败',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }
}

// 导出 CRUD 管理器供其他模块使用
export { userCRUD, postCRUD }
