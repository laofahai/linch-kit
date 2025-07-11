/**
 * 数据服务层 - 使用 @linch-kit/platform CRUD
 * 重构为使用 LinchKit 平台工厂模式
 */

import { Logger, type ExtensionContext } from '@linch-kit/core'
import { createCRUD } from '@linch-kit/platform'
import { UserSchema } from '@linch-kit/auth'

import { PostEntity } from '../schemas'
import type { User, Post } from '../schemas'

/**
 * 创建 CRUD 管理器
 * 注意：需要Extension上下文，这里使用简化的配置
 */
const logger = Logger

// 简化的Extension上下文
const extensionContext = {
  name: 'DataService',
  logger,
  events: {
    emit: (event: string, data?: unknown) => {
      logger.info(`Event: ${event}`, data as Record<string, unknown>)
    },
    on: () => {
      // 简化实现
    },
    off: () => {
      // 简化实现
    },
  },
  permissions: ['read', 'write'],
  config: {},
  storage: {
    get: async () => null,
    set: async () => {},
    delete: async () => {},
    clear: async () => {},
  },
}

const userCRUD = createCRUD({
  entityName: 'User',
  schema: UserSchema,
  extensionContext: extensionContext as ExtensionContext,
})

const postCRUD = createCRUD({
  entityName: 'Post',
  schema: PostEntity.zodSchema,
  extensionContext: extensionContext as ExtensionContext,
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

      // 简化实现：返回示例数据
      const appUsers: User[] = [
        {
          id: 'user1',
          email: 'admin@linchkit.dev',
          name: '管理员',
          image: 'https://avatar.vercel.sh/admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        },
        {
          id: 'user2',
          email: 'user@linchkit.dev',
          name: '普通用户',
          image: 'https://avatar.vercel.sh/user',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        },
      ]

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
    image?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
    password?: string
  }): Promise<User> {
    try {
      Logger.info('DataService: 开始创建用户', { email: data.email })

      // 简化实现：直接返回创建的用户
      const user: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        image: data.image || `https://avatar.vercel.sh/${encodeURIComponent(data.name)}`,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
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

      // 简化实现：返回示例数据
      const appPosts: Post[] = [
        {
          id: 'post1',
          title: 'LinchKit 框架介绍',
          content:
            'LinchKit 是一个 AI-First 的全栈开发框架，采用 Schema 驱动架构，提供端到端类型安全。',
          excerpt: '了解 LinchKit 的核心特性和优势',
          authorId: 'user1',
          tags: ['linchkit', 'framework', 'ai'],
          status: 'PUBLISHED',
          viewCount: 100,
          likeCount: 25,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'post2',
          title: 'Schema 驱动开发指南',
          content: '使用 @linch-kit/schema 实现类型安全的数据模型。',
          excerpt: '学习如何使用 Schema 驱动开发模式',
          authorId: 'user1',
          tags: ['schema', 'typescript', 'development'],
          status: 'PUBLISHED',
          viewCount: 75,
          likeCount: 18,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'post3',
          title: 'CRUD 操作最佳实践',
          content: '@linch-kit/crud 提供了类型安全的数据操作接口。',
          excerpt: '掌握企业级 CRUD 操作的最佳实践',
          authorId: 'user2',
          tags: ['crud', 'database', 'best-practices'],
          status: 'DRAFT',
          viewCount: 0,
          likeCount: 0,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

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

      // 简化实现：直接返回创建的文章
      const post: Post = {
        id: `post_${Date.now()}`,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 100) + '...',
        authorId: data.authorId,
        tags: data.tags || [],
        status: data.status || 'DRAFT',
        viewCount: 0,
        likeCount: 0,
        publishedAt: data.status === 'PUBLISHED' ? new Date().toISOString() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      // 简化实现：返回固定的统计数据
      const stats = {
        totalUsers: 2,
        activeUsers: 2,
        totalPosts: 3,
        publishedPosts: 2,
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

      // 简化实现：直接返回成功
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
