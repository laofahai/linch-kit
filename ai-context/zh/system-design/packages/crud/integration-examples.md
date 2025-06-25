# @linch-kit/crud 集成示例

> **文档类型**: 集成示例  
> **适用场景**: 快速上手CRUD操作开发，了解最佳实践

## 🎯 概览

本文档提供 @linch-kit/crud 与其他包的集成示例，展示如何在实际项目中实现类型安全、权限感知的CRUD操作。

## 📝 基础CRUD集成

### Schema驱动的CRUD生成

```typescript
// crud/user-crud.ts
import { defineCRUD, CRUDService } from '@linch-kit/crud'
import { UserSchema } from '../schemas/user.schema'
import { Logger } from '@linch-kit/core'

// 基于Schema定义CRUD操作
export const UserCRUD = defineCRUD(UserSchema, {
  // 创建操作配置
  create: {
    enabled: true,
    permissions: ['admin', 'manager'],
    validation: {
      strict: true,
      sanitize: true
    },
    hooks: {
      beforeCreate: async (data, context) => {
        // 密码加密
        if (data.password) {
          data.passwordHash = await bcrypt.hash(data.password, 12)
          delete data.password
        }
        
        // 设置默认值
        data.status = data.status || 'active'
        data.emailVerified = false
        
        Logger.info('Creating user', { email: data.email })
        return data
      },
      
      afterCreate: async (user, context) => {
        // 发送欢迎邮件
        await EmailService.sendWelcomeEmail(user.email)
        
        // 创建默认权限
        await RoleManager.assignRole(user.id, 'user')
        
        Logger.info('User created successfully', { userId: user.id })
        return user
      }
    }
  },
  
  // 读取操作配置
  read: {
    enabled: true,
    permissions: ['user', 'admin'],
    filtering: {
      allowed: ['status', 'role', 'createdAt'],
      searchFields: ['name', 'email']
    },
    sorting: {
      allowed: ['name', 'email', 'createdAt'],
      default: { field: 'createdAt', direction: 'desc' }
    },
    pagination: {
      default: { page: 1, limit: 25 },
      maxLimit: 100
    },
    fieldAccess: {
      // 字段级权限控制
      email: { read: ['owner', 'admin'] },
      passwordHash: { read: [] }, // 永不返回
      mfaSecret: { read: [] }
    }
  },
  
  // 更新操作配置
  update: {
    enabled: true,
    permissions: ['owner', 'admin'],
    validation: {
      strict: true,
      allowPartial: true
    },
    optimisticLocking: true,
    hooks: {
      beforeUpdate: async (id, data, context) => {
        // 防止普通用户修改角色
        if (data.roles && !context.user.roles.includes('admin')) {
          delete data.roles
        }
        
        // 密码更新处理
        if (data.password) {
          data.passwordHash = await bcrypt.hash(data.password, 12)
          delete data.password
          data.passwordChangedAt = new Date()
        }
        
        Logger.info('Updating user', { userId: id, fields: Object.keys(data) })
        return data
      },
      
      afterUpdate: async (user, context) => {
        // 清除相关缓存
        await CacheService.invalidate(`user:${user.id}`)
        
        Logger.info('User updated successfully', { userId: user.id })
        return user
      }
    }
  },
  
  // 删除操作配置
  delete: {
    enabled: true,
    permissions: ['admin'],
    softDelete: true,
    hooks: {
      beforeDelete: async (id, context) => {
        // 检查是否有关联数据
        const hasOrders = await OrderService.countByUserId(id)
        if (hasOrders > 0) {
          throw new Error('Cannot delete user with existing orders')
        }
        
        Logger.info('Deleting user', { userId: id })
      },
      
      afterDelete: async (user, context) => {
        // 撤销所有会话
        await SessionManager.revokeAllUserSessions(user.id)
        
        // 发送账户删除通知
        await EmailService.sendAccountDeletedEmail(user.email)
        
        Logger.info('User deleted successfully', { userId: user.id })
      }
    }
  }
})

// 使用CRUD服务
export class UserService {
  static async createUser(data: CreateUserInput, context: Context) {
    return await UserCRUD.create(data, context)
  }
  
  static async findUsers(params: FindUsersInput, context: Context) {
    return await UserCRUD.findMany(params, context)
  }
  
  static async findUserById(id: string, context: Context) {
    return await UserCRUD.findUnique({ where: { id } }, context)
  }
  
  static async updateUser(id: string, data: UpdateUserInput, context: Context) {
    return await UserCRUD.update(id, data, context)
  }
  
  static async deleteUser(id: string, context: Context) {
    return await UserCRUD.delete(id, context)
  }
}
```

### 复杂关系的CRUD操作

```typescript
// crud/blog-crud.ts
import { defineCRUD, RelationCRUD } from '@linch-kit/crud'
import { PostSchema, TagSchema, CommentSchema } from '../schemas/blog.schema'

// 博客文章CRUD
export const PostCRUD = defineCRUD(PostSchema, {
  create: {
    enabled: true,
    permissions: ['author', 'editor', 'admin'],
    validation: { strict: true },
    hooks: {
      beforeCreate: async (data, context) => {
        // 设置作者ID
        data.authorId = context.user.id
        
        // 自动生成slug
        data.slug = generateSlug(data.title)
        
        // 内容安全检查
        data.content = await ContentModerator.sanitize(data.content)
        
        return data
      },
      
      afterCreate: async (post, context) => {
        // 自动保存草稿
        await DraftService.create(post.id, post.content)
        
        // 如果是发布状态，执行发布流程
        if (post.status === 'published') {
          await this.handlePublish(post, context)
        }
        
        return post
      }
    }
  },
  
  read: {
    enabled: true,
    permissions: ['public'], // 公开读取
    filtering: {
      allowed: ['status', 'authorId', 'tags', 'category'],
      searchFields: ['title', 'content', 'excerpt']
    },
    include: {
      // 默认包含关联数据
      author: {
        select: ['id', 'name', 'avatar']
      },
      tags: true,
      _count: {
        comments: true,
        likes: true
      }
    },
    // 基于权限的数据过滤
    dataFilters: {
      'public': {
        where: { status: 'published' }
      },
      'author': {
        where: {
          OR: [
            { status: 'published' },
            { authorId: '${context.user.id}' }
          ]
        }
      },
      'admin': {} // 管理员看到所有数据
    }
  },
  
  update: {
    enabled: true,
    permissions: ['owner', 'editor', 'admin'],
    hooks: {
      beforeUpdate: async (id, data, context) => {
        const existingPost = await PostCRUD.findUnique({ where: { id } })
        
        // 检查所有权
        if (existingPost.authorId !== context.user.id && 
            !context.user.roles.includes('admin')) {
          throw new Error('Permission denied')
        }
        
        // 状态变更处理
        if (data.status && data.status !== existingPost.status) {
          await this.handleStatusChange(existingPost, data.status, context)
        }
        
        return data
      }
    }
  }
})

// 关系操作服务
export class BlogRelationService {
  // 添加标签到文章
  static async addTagsToPost(postId: string, tagIds: string[], context: Context) {
    return await RelationCRUD.connect(PostSchema, 'tags', {
      where: { id: postId },
      connect: tagIds.map(id => ({ id }))
    }, context)
  }
  
  // 移除文章标签
  static async removeTagsFromPost(postId: string, tagIds: string[], context: Context) {
    return await RelationCRUD.disconnect(PostSchema, 'tags', {
      where: { id: postId },
      disconnect: tagIds.map(id => ({ id }))
    }, context)
  }
  
  // 获取文章评论
  static async getPostComments(postId: string, params: any, context: Context) {
    return await RelationCRUD.findMany(PostSchema, 'comments', {
      where: { postId },
      include: {
        author: {
          select: ['id', 'name', 'avatar']
        }
      },
      orderBy: { createdAt: 'desc' },
      ...params
    }, context)
  }
  
  // 添加评论
  static async addComment(postId: string, data: CreateCommentInput, context: Context) {
    return await RelationCRUD.create(PostSchema, 'comments', {
      data: {
        ...data,
        postId,
        authorId: context.user.id
      }
    }, context)
  }
}
```

## 🔗 与其他包的集成

### 与 @linch-kit/auth 集成

```typescript
// integration/crud-auth.ts
import { CRUDPermissionChecker, RowLevelSecurity } from '@linch-kit/crud'
import { PermissionChecker, ABACManager } from '@linch-kit/auth'

export class SecureCRUDService {
  // 带权限检查的查询
  static async findManyWithPermissions<T>(
    crud: any,
    params: any,
    context: Context
  ): Promise<T[]> {
    // 1. 检查基础权限
    const hasReadPermission = await PermissionChecker.check(
      context.user,
      `${crud.entityName}:read`,
      context
    )
    
    if (!hasReadPermission) {
      throw new Error('Insufficient permissions')
    }
    
    // 2. 应用行级安全策略
    const secureParams = await RowLevelSecurity.applyFilters(
      crud.entityName,
      params,
      context
    )
    
    // 3. 执行查询
    const results = await crud.findMany(secureParams, context)
    
    // 4. 字段级权限过滤
    return await this.filterFieldsByPermissions(
      results,
      crud.entityName,
      context
    )
  }
  
  // 字段级权限过滤
  private static async filterFieldsByPermissions(
    records: any[],
    entityName: string,
    context: Context
  ) {
    const filteredRecords = []
    
    for (const record of records) {
      const filteredRecord = { ...record }
      
      // 检查每个字段的访问权限
      for (const field of Object.keys(record)) {
        const hasFieldAccess = await PermissionChecker.check(
          context.user,
          `${entityName}:${field}:read`,
          { record, field }
        )
        
        if (!hasFieldAccess) {
          delete filteredRecord[field]
        }
      }
      
      filteredRecords.push(filteredRecord)
    }
    
    return filteredRecords
  }
  
  // ABAC策略检查
  static async checkABACPolicy(
    user: User,
    action: string,
    resource: any,
    context: any
  ): Promise<boolean> {
    return await ABACManager.evaluateAccess(
      user,
      resource,
      action,
      {
        ...context,
        time: new Date(),
        location: context.location
      }
    )
  }
}

// 行级安全策略配置
export const rowLevelSecurityPolicies = {
  'User': {
    // 用户只能看到自己的数据或公开数据
    'user': {
      read: {
        where: {
          OR: [
            { id: '${context.user.id}' },
            { isPublic: true }
          ]
        }
      },
      update: {
        where: { id: '${context.user.id}' }
      }
    },
    
    // 管理员可以看到所有数据
    'admin': {
      read: {},
      update: {},
      delete: {}
    }
  },
  
  'Post': {
    // 作者可以管理自己的文章
    'author': {
      read: {
        where: {
          OR: [
            { authorId: '${context.user.id}' },
            { status: 'published' }
          ]
        }
      },
      update: {
        where: { authorId: '${context.user.id}' }
      },
      delete: {
        where: { 
          AND: [
            { authorId: '${context.user.id}' },
            { status: { not: 'published' } }
          ]
        }
      }
    },
    
    // 编辑可以管理所有文章
    'editor': {
      read: {},
      update: {},
      delete: {}
    }
  }
}
```

### 与 @linch-kit/schema 集成

```typescript
// integration/crud-schema.ts
import { generateCRUD, CRUDGenerator } from '@linch-kit/crud'
import { ProductSchema, OrderSchema } from '../schemas/ecommerce.schema'

// 从Schema自动生成CRUD
export async function generateEcommerceCRUD() {
  // 生成产品CRUD
  const ProductCRUD = await generateCRUD(ProductSchema, {
    // 自定义生成选项
    includeValidation: true,
    includePermissions: true,
    includePagination: true,
    includeFiltering: true,
    includeSorting: true,
    includeRelations: true,
    
    // 自定义钩子
    hooks: {
      beforeCreate: `
        // 自动生成SKU
        if (!data.sku) {
          data.sku = await generateUniqueSKU(data.category, data.name)
        }
        
        // 价格验证
        if (data.price <= 0) {
          throw new Error('Price must be greater than 0')
        }
        
        return data
      `,
      
      afterCreate: `
        // 创建库存记录
        await InventoryService.create({
          productId: result.id,
          quantity: data.stock || 0
        })
        
        // 发送新品通知
        if (result.featured) {
          await NotificationService.broadcastNewProduct(result)
        }
        
        return result
      `
    },
    
    // 权限配置
    permissions: {
      create: ['admin', 'manager'],
      read: ['public'],
      update: ['admin', 'manager'],
      delete: ['admin']
    }
  })
  
  // 生成订单CRUD
  const OrderCRUD = await generateCRUD(OrderSchema, {
    // 订单特定配置
    softDelete: false, // 订单不允许删除
    optimisticLocking: true,
    auditTrail: true,
    
    hooks: {
      beforeCreate: `
        // 生成订单号
        data.orderNumber = await generateOrderNumber()
        
        // 验证库存
        for (const item of data.items) {
          const available = await InventoryService.checkAvailability(
            item.productId, 
            item.quantity
          )
          if (!available) {
            throw new Error(\`Product \${item.productId} out of stock\`)
          }
        }
        
        // 计算总价
        data.total = await calculateOrderTotal(data.items)
        
        return data
      `,
      
      afterCreate: `
        // 扣减库存
        for (const item of data.items) {
          await InventoryService.reserve(item.productId, item.quantity)
        }
        
        // 发送订单确认邮件
        await EmailService.sendOrderConfirmation(result)
        
        // 创建支付记录
        await PaymentService.initiate(result.id, result.total)
        
        return result
      `,
      
      beforeUpdate: `
        const existingOrder = await OrderCRUD.findUnique({ where: { id } })
        
        // 检查订单状态
        if (existingOrder.status === 'shipped' && data.items) {
          throw new Error('Cannot modify shipped order items')
        }
        
        return data
      `
    },
    
    // 状态机配置
    stateMachine: {
      field: 'status',
      states: {
        'pending': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': []
      }
    }
  })
  
  return { ProductCRUD, OrderCRUD }
}

// Schema变更时自动重新生成CRUD
export class CRUDRegenerator {
  static async watchSchemaChanges() {
    const schemaWatcher = new SchemaWatcher('./schemas/**/*.schema.ts')
    
    schemaWatcher.on('change', async (changedSchemas) => {
      Logger.info('Schema changed, regenerating CRUD', {
        schemas: changedSchemas.map(s => s.name)
      })
      
      for (const schema of changedSchemas) {
        try {
          await this.regenerateCRUD(schema)
          Logger.info(`CRUD regenerated for ${schema.name}`)
        } catch (error) {
          Logger.error(`Failed to regenerate CRUD for ${schema.name}`, error)
        }
      }
    })
  }
  
  private static async regenerateCRUD(schema: any) {
    const crudConfig = await this.loadCRUDConfig(schema.name)
    const newCRUD = await generateCRUD(schema, crudConfig)
    
    // 热重载CRUD服务
    await this.hotReloadCRUD(schema.name, newCRUD)
  }
}
```

### 与 @linch-kit/trpc 集成

```typescript
// integration/crud-trpc.ts
import { createTRPCRouter, protectedProcedure } from '@linch-kit/trpc'
import { generateTRPCRoutes } from '@linch-kit/crud'
import { UserCRUD, PostCRUD } from '../crud'

// 自动生成tRPC路由
export const userRouter = generateTRPCRoutes(UserCRUD, {
  // 路由配置
  routes: {
    create: {
      enabled: true,
      middleware: ['auth', 'validate', 'rateLimit'],
      input: 'CreateUserInput',
      output: 'UserOutput'
    },
    
    findMany: {
      enabled: true,
      middleware: ['auth', 'paginate'],
      input: 'FindManyUserInput',
      output: 'UserListOutput'
    },
    
    findUnique: {
      enabled: true,
      middleware: ['auth'],
      input: 'FindUniqueUserInput',
      output: 'UserOutput'
    },
    
    update: {
      enabled: true,
      middleware: ['auth', 'validate', 'ownership'],
      input: 'UpdateUserInput',
      output: 'UserOutput'
    },
    
    delete: {
      enabled: true,
      middleware: ['auth', 'ownership', 'confirm'],
      input: 'DeleteUserInput',
      output: 'DeleteUserOutput'
    }
  },
  
  // 自定义路由
  customRoutes: {
    // 批量操作
    bulkUpdate: protectedProcedure
      .input(z.object({
        ids: z.array(z.string()),
        data: z.object({
          status: z.enum(['active', 'inactive']).optional(),
          roles: z.array(z.string()).optional()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        // 检查批量操作权限
        const canBulkUpdate = await PermissionChecker.check(
          ctx.user,
          'user:bulk-update'
        )
        
        if (!canBulkUpdate) {
          throw new Error('Insufficient permissions for bulk operations')
        }
        
        const results = []
        for (const id of input.ids) {
          try {
            const updated = await UserCRUD.update(id, input.data, ctx)
            results.push({ id, success: true, data: updated })
          } catch (error) {
            results.push({ id, success: false, error: error.message })
          }
        }
        
        return { results }
      }),
    
    // 统计信息
    stats: protectedProcedure
      .input(z.object({
        dateRange: z.object({
          start: z.date(),
          end: z.date()
        }).optional()
      }))
      .query(async ({ input, ctx }) => {
        return await UserCRUD.getStats(input, ctx)
      }),
    
    // 导出数据
    export: protectedProcedure
      .input(z.object({
        format: z.enum(['csv', 'xlsx', 'json']),
        filters: z.any().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const hasExportPermission = await PermissionChecker.check(
          ctx.user,
          'user:export'
        )
        
        if (!hasExportPermission) {
          throw new Error('Export permission required')
        }
        
        return await UserCRUD.export(input, ctx)
      })
  }
})

// 复杂查询路由
export const advancedQueryRouter = createTRPCRouter({
  // 多表关联查询
  userWithPosts: protectedProcedure
    .input(z.object({
      userId: z.string(),
      postFilters: z.object({
        status: z.enum(['draft', 'published']).optional(),
        tags: z.array(z.string()).optional()
      }).optional()
    }))
    .query(async ({ input, ctx }) => {
      return await UserCRUD.findUnique({
        where: { id: input.userId },
        include: {
          posts: {
            where: input.postFilters,
            include: {
              tags: true,
              _count: { comments: true }
            }
          }
        }
      }, ctx)
    }),
  
  // 聚合查询
  userStatistics: protectedProcedure
    .input(z.object({
      groupBy: z.array(z.enum(['role', 'status', 'createdAt'])),
      metrics: z.array(z.enum(['count', 'avgAge', 'lastLogin']))
    }))
    .query(async ({ input, ctx }) => {
      return await UserCRUD.aggregate(input, ctx)
    }),
  
  // 全文搜索
  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string(),
      filters: z.object({
        roles: z.array(z.string()).optional(),
        status: z.array(z.string()).optional()
      }).optional(),
      pagination: z.object({
        page: z.number().default(1),
        limit: z.number().default(25)
      }).optional()
    }))
    .query(async ({ input, ctx }) => {
      return await UserCRUD.search(input, ctx)
    })
})
```

## 🚀 高级CRUD模式

### 审计追踪

```typescript
// patterns/audit-trail.ts
import { CRUDAuditTrail, AuditLogger } from '@linch-kit/crud'

export class AuditTrailCRUD {
  static enhance<T>(crud: any, entityName: string) {
    return {
      ...crud,
      
      async create(data: any, context: any) {
        const result = await crud.create(data, context)
        
        await AuditLogger.log({
          entityName,
          entityId: result.id,
          operation: 'create',
          userId: context.user.id,
          oldValues: null,
          newValues: result,
          timestamp: new Date(),
          metadata: {
            userAgent: context.userAgent,
            ipAddress: context.ipAddress
          }
        })
        
        return result
      },
      
      async update(id: string, data: any, context: any) {
        // 获取更新前的值
        const oldValues = await crud.findUnique({ where: { id } }, context)
        
        const result = await crud.update(id, data, context)
        
        await AuditLogger.log({
          entityName,
          entityId: id,
          operation: 'update',
          userId: context.user.id,
          oldValues,
          newValues: result,
          changedFields: this.getChangedFields(oldValues, result),
          timestamp: new Date(),
          metadata: {
            userAgent: context.userAgent,
            ipAddress: context.ipAddress
          }
        })
        
        return result
      },
      
      async delete(id: string, context: any) {
        const oldValues = await crud.findUnique({ where: { id } }, context)
        
        const result = await crud.delete(id, context)
        
        await AuditLogger.log({
          entityName,
          entityId: id,
          operation: 'delete',
          userId: context.user.id,
          oldValues,
          newValues: null,
          timestamp: new Date(),
          metadata: {
            userAgent: context.userAgent,
            ipAddress: context.ipAddress
          }
        })
        
        return result
      }
    }
  }
  
  private static getChangedFields(oldValues: any, newValues: any): string[] {
    const changed = []
    
    for (const key of Object.keys(newValues)) {
      if (oldValues[key] !== newValues[key]) {
        changed.push(key)
      }
    }
    
    return changed
  }
}
```

### 乐观锁并发控制

```typescript
// patterns/optimistic-locking.ts
import { OptimisticLockingCRUD, ConcurrencyError } from '@linch-kit/crud'

export class ConcurrentUpdateHandler {
  static enhance<T>(crud: any) {
    return {
      ...crud,
      
      async update(id: string, data: any, context: any) {
        const maxRetries = 3
        let attempt = 0
        
        while (attempt < maxRetries) {
          try {
            // 获取当前版本
            const current = await crud.findUnique({ 
              where: { id },
              select: { version: true }
            }, context)
            
            if (!current) {
              throw new Error('Record not found')
            }
            
            // 检查版本冲突
            if (data.version && data.version !== current.version) {
              throw new ConcurrencyError('Record has been modified by another user')
            }
            
            // 更新时递增版本号
            const updateData = {
              ...data,
              version: current.version + 1
            }
            
            const result = await crud.update(id, updateData, context)
            return result
            
          } catch (error) {
            if (error instanceof ConcurrencyError && attempt < maxRetries - 1) {
              attempt++
              // 指数退避重试
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
              continue
            }
            throw error
          }
        }
      }
    }
  }
}
```

### 批量操作优化

```typescript
// patterns/batch-operations.ts
import { BatchCRUD, TransactionManager } from '@linch-kit/crud'

export class BatchOperationService {
  static async bulkCreate<T>(
    crud: any,
    records: any[],
    context: any,
    options: { batchSize?: number, transaction?: boolean } = {}
  ) {
    const { batchSize = 100, transaction = true } = options
    const results = []
    
    // 分批处理
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      if (transaction) {
        const batchResults = await TransactionManager.execute(async (tx) => {
          const promises = batch.map(record => 
            crud.create(record, { ...context, transaction: tx })
          )
          return await Promise.all(promises)
        })
        results.push(...batchResults)
      } else {
        const promises = batch.map(record => crud.create(record, context))
        const batchResults = await Promise.all(promises)
        results.push(...batchResults)
      }
    }
    
    return results
  }
  
  static async bulkUpdate<T>(
    crud: any,
    updates: Array<{ id: string; data: any }>,
    context: any,
    options: { batchSize?: number, transaction?: boolean } = {}
  ) {
    const { batchSize = 50, transaction = true } = options
    const results = []
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      if (transaction) {
        const batchResults = await TransactionManager.execute(async (tx) => {
          const promises = batch.map(({ id, data }) => 
            crud.update(id, data, { ...context, transaction: tx })
          )
          return await Promise.all(promises)
        })
        results.push(...batchResults)
      } else {
        const promises = batch.map(({ id, data }) => crud.update(id, data, context))
        const batchResults = await Promise.all(promises)
        results.push(...batchResults)
      }
    }
    
    return results
  }
  
  static async bulkDelete<T>(
    crud: any,
    ids: string[],
    context: any,
    options: { batchSize?: number, transaction?: boolean } = {}
  ) {
    const { batchSize = 50, transaction = true } = options
    const results = []
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      
      if (transaction) {
        const batchResults = await TransactionManager.execute(async (tx) => {
          const promises = batch.map(id => 
            crud.delete(id, { ...context, transaction: tx })
          )
          return await Promise.all(promises)
        })
        results.push(...batchResults)
      } else {
        const promises = batch.map(id => crud.delete(id, context))
        const batchResults = await Promise.all(promises)
        results.push(...batchResults)
      }
    }
    
    return results
  }
}
```

## 📝 最佳实践

### 1. 性能优化

```typescript
// ✅ 查询优化
export const performanceOptimizedCRUD = {
  // 使用选择字段减少数据传输
  findMany: async (params: any, context: any) => {
    return await crud.findMany({
      ...params,
      select: {
        id: true,
        name: true,
        email: true,
        // 不选择大字段
        avatar: false,
        profile: false
      }
    }, context)
  },
  
  // 使用索引优化查询
  findByEmail: async (email: string, context: any) => {
    return await crud.findUnique({
      where: { email }, // email字段有唯一索引
      select: { id: true, name: true, email: true }
    }, context)
  },
  
  // 分页查询优化
  findManyPaginated: async (params: any, context: any) => {
    const { page = 1, limit = 25 } = params
    const offset = (page - 1) * limit
    
    return await crud.findMany({
      ...params,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' } // 使用索引字段排序
    }, context)
  }
}
```

### 2. 错误处理

```typescript
// ✅ 统一错误处理
export class CRUDErrorHandler {
  static wrapCRUD(crud: any) {
    return {
      ...crud,
      
      async create(data: any, context: any) {
        try {
          return await crud.create(data, context)
        } catch (error) {
          throw this.handleError(error, 'create', data)
        }
      },
      
      async update(id: string, data: any, context: any) {
        try {
          return await crud.update(id, data, context)
        } catch (error) {
          throw this.handleError(error, 'update', { id, data })
        }
      }
    }
  }
  
  private static handleError(error: any, operation: string, context: any) {
    if (error.code === 'P2002') {
      // Prisma unique constraint error
      return new ConflictError('Record already exists')
    }
    
    if (error.code === 'P2025') {
      // Prisma record not found error
      return new NotFoundError('Record not found')
    }
    
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message)
    }
    
    // 记录未知错误
    Logger.error(`CRUD ${operation} failed`, error, context)
    return new InternalServerError('Operation failed')
  }
}
```

## 🔗 相关链接

- [API参考](./api-reference.md) - 完整API文档
- [实现指南](./implementation-guide.md) - 内部架构设计
- [依赖分析](./dependencies-analysis.md) - 包依赖关系
- [集成模式](../../../shared/integration-patterns.md) - 通用集成模式