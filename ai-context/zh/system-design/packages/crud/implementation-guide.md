# @linch-kit/crud 实现指南

> **文档类型**: 实现细节  
> **适用场景**: 深度定制和扩展

## 🏗️ 架构设计

### 模块组织
```
src/
├── core/               # 核心CRUD引擎
│   ├── manager.ts      # CRUD管理器
│   ├── query-builder.ts # 查询构建器
│   └── repository.ts   # 仓储模式实现
├── operations/         # CRUD操作
│   ├── create.ts       # 创建操作
│   ├── read.ts         # 读取操作
│   ├── update.ts       # 更新操作
│   └── delete.ts       # 删除操作
├── batch/              # 批量操作
│   ├── batch-create.ts # 批量创建
│   ├── batch-update.ts # 批量更新
│   └── batch-delete.ts # 批量删除
├── permissions/        # 权限集成
│   ├── field-filter.ts # 字段级权限
│   ├── row-filter.ts   # 行级权限
│   └── middleware.ts   # 权限中间件
├── validation/         # 数据验证
│   ├── schema-validator.ts # Schema验证
│   ├── custom-validator.ts # 自定义验证
│   └── async-validator.ts  # 异步验证
├── cache/              # 缓存层
│   ├── query-cache.ts  # 查询缓存
│   ├── entity-cache.ts # 实体缓存
│   └── invalidation.ts # 缓存失效
└── integrations/       # 外部集成
    ├── prisma.ts       # Prisma ORM集成
    ├── auth.ts         # 认证集成
    └── schema.ts       # Schema集成
```

## 🎯 核心实现策略

### 基于 Prisma ORM (数据访问核心)

```typescript
import { PrismaClient, Prisma } from '@prisma/client'
import type { DefaultArgs } from '@prisma/client/runtime/library'

/**
 * CRUD管理器 - 基于 Prisma ORM
 * 
 * 设计原则：
 * - 使用 Prisma 而不是自己实现 ORM 功能
 * - 利用 Prisma 的类型安全和代码生成
 * - 集成 Prisma 的事务和连接池管理
 * - 保持与 LinchKit Schema 系统的兼容性
 */
class PrismaCrudManager {
  constructor(
    private prisma: PrismaClient,
    private schemaRegistry: SchemaRegistry
  ) {}
  
  async create<T>(
    entityName: string, 
    data: CreateInput<T>, 
    options?: CrudOptions
  ): Promise<T> {
    // 1. 获取实体 Schema 定义
    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`)
    }
    
    // 2. 验证输入数据
    if (!options?.skipValidation) {
      await this.validateCreateData(entity, data)
    }
    
    // 3. 权限检查
    if (!options?.skipPermissions && options?.user) {
      await this.checkCreatePermission(entity, options.user, data)
    }
    
    // 4. 数据预处理
    const processedData = await this.preprocessCreateData(entity, data)
    
    // 5. 使用 Prisma 执行创建
    const prismaModel = this.getPrismaModel(entityName)
    const result = await prismaModel.create({
      data: processedData,
      include: this.buildInclude(entity)
    })
    
    // 6. 后处理和审计
    await this.postProcessCreate(entity, result, options)
    
    return result as T
  }
  
  async findMany<T>(
    entityName: string, 
    query?: QueryInput, 
    options?: FindOptions
  ): Promise<T[]> {
    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`)
    }
    
    // 构建 Prisma 查询条件
    const prismaQuery = await this.buildPrismaQuery(entity, query, options)
    
    // 应用权限过滤
    if (options?.user && !options?.skipPermissions) {
      prismaQuery.where = {
        ...prismaQuery.where,
        ...await this.buildPermissionFilter(entity, options.user, 'read')
      }
    }
    
    // 执行查询 - 使用 Prisma 的优化查询
    const prismaModel = this.getPrismaModel(entityName)
    const results = await prismaModel.findMany(prismaQuery)
    
    // 字段级权限过滤
    if (options?.user && !options?.skipPermissions) {
      return await this.applyFieldPermissions(results, entity, options.user, 'read')
    }
    
    return results as T[]
  }
  
  async update<T>(
    entityName: string, 
    id: string, 
    data: UpdateInput<T>, 
    options?: CrudOptions
  ): Promise<T> {
    const entity = this.schemaRegistry.getEntity(entityName)
    
    // 检查记录是否存在
    const existing = await this.findById(entityName, id, { skipPermissions: true })
    if (!existing) {
      throw new Error(`Record with ID ${id} not found`)
    }
    
    // 权限检查
    if (!options?.skipPermissions && options?.user) {
      await this.checkUpdatePermission(entity, options.user, existing, data)
    }
    
    // 验证更新数据
    if (!options?.skipValidation) {
      await this.validateUpdateData(entity, id, data)
    }
    
    // 数据预处理
    const processedData = await this.preprocessUpdateData(entity, data, existing)
    
    // 使用 Prisma 执行更新
    const prismaModel = this.getPrismaModel(entityName)
    const result = await prismaModel.update({
      where: { id },
      data: processedData,
      include: this.buildInclude(entity)
    })
    
    await this.postProcessUpdate(entity, result, existing, options)
    
    return result as T
  }
  
  async delete(
    entityName: string, 
    id: string, 
    options?: CrudOptions
  ): Promise<boolean> {
    const entity = this.schemaRegistry.getEntity(entityName)
    
    const existing = await this.findById(entityName, id, { skipPermissions: true })
    if (!existing) {
      return false
    }
    
    // 权限检查
    if (!options?.skipPermissions && options?.user) {
      await this.checkDeletePermission(entity, options.user, existing)
    }
    
    const prismaModel = this.getPrismaModel(entityName)
    
    // 软删除 vs 硬删除
    if (entity.options.softDelete) {
      await prismaModel.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          deletedBy: options?.user?.id 
        }
      })
    } else {
      await prismaModel.delete({
        where: { id }
      })
    }
    
    await this.postProcessDelete(entity, existing, options)
    
    return true
  }
  
  // 获取对应的 Prisma 模型
  private getPrismaModel(entityName: string) {
    const modelName = entityName.toLowerCase()
    const model = (this.prisma as any)[modelName]
    
    if (!model) {
      throw new Error(`Prisma model for entity ${entityName} not found`)
    }
    
    return model
  }
  
  // 构建 Prisma 查询条件
  private async buildPrismaQuery(
    entity: Entity, 
    query?: QueryInput, 
    options?: FindOptions
  ): Promise<any> {
    const prismaQuery: any = {}
    
    if (query?.where) {
      prismaQuery.where = this.buildWhereClause(query.where)
    }
    
    if (query?.orderBy) {
      prismaQuery.orderBy = query.orderBy.map(order => ({
        [order.field]: order.direction
      }))
    }
    
    if (query?.include) {
      prismaQuery.include = this.buildIncludeFromQuery(query.include)
    }
    
    if (query?.limit) {
      prismaQuery.take = query.limit
    }
    
    if (query?.offset) {
      prismaQuery.skip = query.offset
    }
    
    return prismaQuery
  }
  
  // 构建 WHERE 子句
  private buildWhereClause(whereConditions: WhereClause[]): any {
    const where: any = {}
    
    whereConditions.forEach(condition => {
      const { field, operator, value } = condition
      
      switch (operator) {
        case '=':
          where[field] = value
          break
        case '!=':
          where[field] = { not: value }
          break
        case '>':
          where[field] = { gt: value }
          break
        case '>=':
          where[field] = { gte: value }
          break
        case '<':
          where[field] = { lt: value }
          break
        case '<=':
          where[field] = { lte: value }
          break
        case 'like':
          where[field] = { contains: value, mode: 'insensitive' }
          break
        case 'in':
          where[field] = { in: value }
          break
        default:
          throw new Error(`Unsupported operator: ${operator}`)
      }
    })
    
    return where
  }
}
```

### 查询构建器 (基于 Prisma 查询能力)

```typescript
/**
 * 查询构建器 - 基于 Prisma 查询语法
 * 
 * 设计原则：
 * - 提供链式 API，最终转换为 Prisma 查询
 * - 利用 Prisma 的类型推导和查询优化
 * - 支持复杂关联查询和聚合操作
 */
class PrismaQueryBuilder<T = any> {
  private query: any = {}
  private entityName: string
  
  constructor(
    entityName: string, 
    private prisma: PrismaClient,
    private schemaRegistry: SchemaRegistry
  ) {
    this.entityName = entityName
  }
  
  static from<T>(entityName: string): PrismaQueryBuilder<T> {
    return new PrismaQueryBuilder<T>(entityName, prisma, schemaRegistry)
  }
  
  where(field: keyof T, operator: Operator, value: any): this {
    if (!this.query.where) {
      this.query.where = {}
    }
    
    // 转换为 Prisma 查询语法
    switch (operator) {
      case '=':
        this.query.where[field as string] = value
        break
      case '!=':
        this.query.where[field as string] = { not: value }
        break
      case '>':
        this.query.where[field as string] = { gt: value }
        break
      case '>=':
        this.query.where[field as string] = { gte: value }
        break
      case '<':
        this.query.where[field as string] = { lt: value }
        break
      case '<=':
        this.query.where[field as string] = { lte: value }
        break
      case 'like':
        this.query.where[field as string] = { 
          contains: value, 
          mode: 'insensitive' 
        }
        break
    }
    
    return this
  }
  
  whereIn(field: keyof T, values: any[]): this {
    if (!this.query.where) {
      this.query.where = {}
    }
    
    this.query.where[field as string] = { in: values }
    return this
  }
  
  include(relation: string, callback?: (qb: PrismaQueryBuilder) => void): this {
    if (!this.query.include) {
      this.query.include = {}
    }
    
    if (callback) {
      const subQuery = new PrismaQueryBuilder(relation, this.prisma, this.schemaRegistry)
      callback(subQuery)
      this.query.include[relation] = subQuery.build()
    } else {
      this.query.include[relation] = true
    }
    
    return this
  }
  
  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.query.orderBy) {
      this.query.orderBy = []
    }
    
    this.query.orderBy.push({
      [field as string]: direction
    })
    
    return this
  }
  
  limit(count: number): this {
    this.query.take = count
    return this
  }
  
  offset(count: number): this {
    this.query.skip = count
    return this
  }
  
  paginate(page: number, pageSize: number): this {
    this.query.skip = (page - 1) * pageSize
    this.query.take = pageSize
    return this
  }
  
  // 聚合操作 - 使用 Prisma 的聚合 API
  async count(field?: keyof T): Promise<number> {
    const model = this.getPrismaModel()
    
    if (field) {
      const result = await model.aggregate({
        where: this.query.where,
        _count: { [field as string]: true }
      })
      return result._count[field as string]
    } else {
      return await model.count({
        where: this.query.where
      })
    }
  }
  
  async sum(field: keyof T): Promise<number> {
    const model = this.getPrismaModel()
    const result = await model.aggregate({
      where: this.query.where,
      _sum: { [field as string]: true }
    })
    
    return result._sum[field as string] || 0
  }
  
  async avg(field: keyof T): Promise<number> {
    const model = this.getPrismaModel()
    const result = await model.aggregate({
      where: this.query.where,
      _avg: { [field as string]: true }
    })
    
    return result._avg[field as string] || 0
  }
  
  async execute(): Promise<T[]> {
    const model = this.getPrismaModel()
    return await model.findMany(this.query)
  }
  
  async first(): Promise<T | null> {
    const model = this.getPrismaModel()
    return await model.findFirst(this.query)
  }
  
  async exists(): Promise<boolean> {
    const count = await this.count()
    return count > 0
  }
  
  build(): any {
    return this.query
  }
  
  private getPrismaModel() {
    const modelName = this.entityName.toLowerCase()
    return (this.prisma as any)[modelName]
  }
}
```

### 批量操作 (基于 Prisma 事务)

```typescript
/**
 * 批量操作管理器 - 基于 Prisma 事务和批量 API
 * 
 * 设计原则：
 * - 使用 Prisma 的 createMany、updateMany 等批量 API
 * - 利用 Prisma 事务确保数据一致性
 * - 优化大批量操作的性能
 */
class PrismaBatchOperations {
  constructor(
    private prisma: PrismaClient,
    private crudManager: PrismaCrudManager
  ) {}
  
  async createMany<T>(
    entityName: string, 
    data: CreateInput<T>[], 
    options?: BatchOptions
  ): Promise<T[]> {
    const entity = this.crudManager.schemaRegistry.getEntity(entityName)
    
    // 批量验证
    if (!options?.skipValidation) {
      await this.validateBatchCreateData(entity, data)
    }
    
    // 权限检查
    if (!options?.skipPermissions && options?.user) {
      for (const item of data) {
        await this.crudManager.checkCreatePermission(entity, options.user, item)
      }
    }
    
    // 数据预处理
    const processedData = await Promise.all(
      data.map(item => this.crudManager.preprocessCreateData(entity, item))
    )
    
    // 使用 Prisma 事务执行批量创建
    const model = this.getPrismaModel(entityName)
    
    return await this.prisma.$transaction(async (tx) => {
      // 使用 createMany 进行批量插入（更高效）
      const createResult = await (tx as any)[entityName.toLowerCase()].createMany({
        data: processedData,
        skipDuplicates: options?.skipDuplicates || false
      })
      
      // 如果需要返回创建的记录，需要再次查询
      if (options?.returnRecords !== false) {
        // 获取刚创建的记录
        const createdRecords = await (tx as any)[entityName.toLowerCase()].findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 1000) // 最近1秒创建的记录
            }
          },
          orderBy: { createdAt: 'desc' },
          take: processedData.length
        })
        
        return createdRecords
      }
      
      return []
    })
  }
  
  async updateMany<T>(
    entityName: string, 
    query: QueryInput, 
    data: UpdateInput<T>, 
    options?: BatchOptions
  ): Promise<number> {
    const entity = this.crudManager.schemaRegistry.getEntity(entityName)
    const model = this.getPrismaModel(entityName)
    
    // 构建 Prisma 查询条件
    const whereClause = this.crudManager.buildWhereClause(query.where || [])
    
    // 权限检查 - 先查询要更新的记录
    if (!options?.skipPermissions && options?.user) {
      const recordsToUpdate = await model.findMany({ where: whereClause })
      
      for (const record of recordsToUpdate) {
        await this.crudManager.checkUpdatePermission(entity, options.user, record, data)
      }
    }
    
    // 验证更新数据
    if (!options?.skipValidation) {
      await this.crudManager.validateUpdateData(entity, 'batch', data)
    }
    
    // 数据预处理
    const processedData = await this.crudManager.preprocessUpdateData(entity, data)
    
    // 执行批量更新
    const result = await model.updateMany({
      where: whereClause,
      data: processedData
    })
    
    return result.count
  }
  
  async deleteMany(
    entityName: string, 
    query: QueryInput, 
    options?: BatchOptions
  ): Promise<number> {
    const entity = this.crudManager.schemaRegistry.getEntity(entityName)
    const model = this.getPrismaModel(entityName)
    
    const whereClause = this.crudManager.buildWhereClause(query.where || [])
    
    // 权限检查
    if (!options?.skipPermissions && options?.user) {
      const recordsToDelete = await model.findMany({ where: whereClause })
      
      for (const record of recordsToDelete) {
        await this.crudManager.checkDeletePermission(entity, options.user, record)
      }
    }
    
    let result: { count: number }
    
    // 软删除 vs 硬删除
    if (entity.options.softDelete) {
      result = await model.updateMany({
        where: whereClause,
        data: { 
          deletedAt: new Date(),
          deletedBy: options?.user?.id 
        }
      })
    } else {
      result = await model.deleteMany({
        where: whereClause
      })
    }
    
    return result.count
  }
  
  // Upsert 操作 - 存在则更新，不存在则创建
  async upsertMany<T>(
    entityName: string, 
    data: UpsertInput<T>[], 
    options?: UpsertOptions
  ): Promise<T[]> {
    const results: T[] = []
    
    // 使用事务执行批量 upsert
    return await this.prisma.$transaction(async (tx) => {
      for (const item of data) {
        const model = (tx as any)[entityName.toLowerCase()]
        
        const result = await model.upsert({
          where: { id: item.id || 'non-existent-id' },
          update: item,
          create: item,
          include: options?.include
        })
        
        results.push(result)
      }
      
      return results
    })
  }
  
  private getPrismaModel(entityName: string) {
    const modelName = entityName.toLowerCase()
    return (this.prisma as any)[modelName]
  }
}
```

## 🔗 权限和Schema集成

### 与@linch-kit/auth集成
```typescript
import { PermissionChecker, User } from '@linch-kit/auth'
import { Entity, FieldPermissions } from '@linch-kit/schema'

/**
 * 权限感知CRUD - 与 @linch-kit/auth 深度集成
 */
class PermissionAwareCrudIntegration {
  async checkCreatePermission(
    entity: Entity, 
    user: User, 
    data: any
  ): Promise<void> {
    // 实体级权限检查
    const canCreate = await PermissionChecker.check(
      user, 
      `${entity.name}:create`
    )
    
    if (!canCreate) {
      throw new PermissionError(`No permission to create ${entity.name}`)
    }
    
    // 字段级权限检查
    for (const [fieldName, fieldValue] of Object.entries(data)) {
      const field = entity.fields[fieldName]
      if (field?.permissions?.write) {
        const canWriteField = await PermissionChecker.check(
          user, 
          `${entity.name}:write:${fieldName}`
        )
        
        if (!canWriteField) {
          throw new PermissionError(`No permission to write field ${fieldName}`)
        }
      }
    }
  }
  
  async applyFieldPermissions<T>(
    results: T[], 
    entity: Entity, 
    user: User, 
    operation: 'read' | 'write'
  ): Promise<Partial<T>[]> {
    return await Promise.all(
      results.map(async (result) => {
        const filteredResult: Partial<T> = {}
        
        for (const [fieldName, fieldValue] of Object.entries(result as any)) {
          const field = entity.fields[fieldName]
          
          // 检查字段权限
          if (field?.permissions?.[operation]) {
            const hasPermission = await PermissionChecker.check(
              user, 
              `${entity.name}:${operation}:${fieldName}`,
              { resource: result }
            )
            
            if (hasPermission) {
              (filteredResult as any)[fieldName] = fieldValue
            }
          } else {
            // 没有权限配置的字段默认允许
            (filteredResult as any)[fieldName] = fieldValue
          }
        }
        
        return filteredResult
      })
    )
  }
  
  async buildPermissionFilter(
    entity: Entity, 
    user: User, 
    operation: 'read' | 'write' | 'delete'
  ): Promise<any> {
    // 获取用户的行级权限过滤条件
    const permissions = entity.options.permissions?.[operation]
    if (!permissions) return {}
    
    const filters: any = {}
    
    for (const permission of permissions) {
      if (permission.condition) {
        // 解析权限条件，转换为 Prisma 查询条件
        const condition = await this.parsePermissionCondition(
          permission.condition, 
          user
        )
        
        Object.assign(filters, condition)
      }
    }
    
    return filters
  }
  
  private async parsePermissionCondition(
    condition: string, 
    user: User
  ): Promise<any> {
    // 简单的条件解析器，生产环境应该使用更安全的表达式引擎
    const context = {
      user: {
        id: user.id,
        roles: user.roles.map(r => r.name),
        department: user.department
      }
    }
    
    try {
      // 使用 JSON Logic 或类似的安全表达式引擎
      const logic = JSON.parse(condition)
      return this.evaluateLogicCondition(logic, context)
    } catch (error) {
      Logger.warn(`Invalid permission condition: ${condition}`)
      return {}
    }
  }
}
```

## 📊 缓存和性能优化

### 基于Redis的查询缓存
```typescript
import Redis from 'ioredis'
import { LRUCache } from 'lru-cache'

/**
 * 查询缓存管理器 - 基于 Redis + LRU Cache
 */
class QueryCacheManager {
  private redis: Redis
  private localCache = new LRUCache<string, any>({
    max: 1000,
    ttl: 1000 * 60 * 5 // 5分钟本地缓存
  })
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'linchkit:crud:cache:'
    })
  }
  
  async get<T>(cacheKey: string): Promise<T | null> {
    // 先检查本地缓存
    const localResult = this.localCache.get(cacheKey)
    if (localResult) {
      return localResult
    }
    
    // 再检查 Redis 缓存
    const redisResult = await this.redis.get(cacheKey)
    if (redisResult) {
      const parsed = JSON.parse(redisResult)
      this.localCache.set(cacheKey, parsed)
      return parsed
    }
    
    return null
  }
  
  async set<T>(cacheKey: string, data: T, ttl: number = 300): Promise<void> {
    const serialized = JSON.stringify(data)
    
    // 写入 Redis
    await this.redis.setex(cacheKey, ttl, serialized)
    
    // 写入本地缓存
    this.localCache.set(cacheKey, data, { ttl: ttl * 1000 })
  }
  
  async invalidate(pattern: string): Promise<void> {
    // 清除 Redis 中匹配的键
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
    
    // 清除本地缓存中匹配的键
    for (const key of this.localCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.localCache.delete(key)
      }
    }
  }
  
  generateCacheKey(
    entityName: string, 
    operation: string, 
    params: any
  ): string {
    const paramHash = createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex')
    
    return `${entityName}:${operation}:${paramHash}`
  }
}
```

## 📋 依赖关系总结

### 输入依赖
```typescript
// 来自 @linch-kit/core
import { PluginSystem, Logger, EventBus } from '@linch-kit/core'

// 来自 @linch-kit/schema  
import { Entity, FieldDefinition, ValidationRule } from '@linch-kit/schema'

// 来自 @linch-kit/auth
import { PermissionChecker, User } from '@linch-kit/auth'

// 主要第三方库
import { PrismaClient } from '@prisma/client'  // ORM 核心，减少 90% 数据访问代码
import { LRUCache } from 'lru-cache'           // 缓存，减少 80% 缓存实现代码  
import Redis from 'ioredis'                   // 分布式缓存
```

### 循环依赖检查
```typescript
/**
 * ✅ 无循环依赖验证
 * 
 * @linch-kit/crud 的位置：
 * - 依赖：core ✅, schema ✅, auth ✅
 * - 被依赖：trpc ✅, console ✅  
 * - 不应该依赖：trpc, console ❌
 * 
 * 设计原则：
 * - 实现 Schema 定义的 CRUD 操作
 * - 使用 Auth 包的权限检查服务
 * - 不向上层包暴露实现细节
 */
```

### 性能提升对比
| 功能 | 自建代码行数 | 使用第三方库行数 | 减少比例 | 额外收益 |
|------|-------------|----------------|---------|----------|
| ORM 功能 | ~2000 | ~300 | 85% | 类型安全、查询优化 |
| 查询构建器 | ~800 | ~200 | 75% | SQL 注入防护 |
| 事务管理 | ~500 | ~100 | 80% | 连接池管理 |
| 缓存系统 | ~600 | ~150 | 75% | 分布式支持 |
| 批量操作 | ~400 | ~80 | 80% | 性能优化 |

**总结**: @linch-kit/crud 通过基于 Prisma ORM 和成熟缓存库，避免了重复造轮子，同时保持了高度的类型安全性和性能优化。关键是将 LinchKit 的 Schema 驱动理念与 Prisma 的强大功能相结合。