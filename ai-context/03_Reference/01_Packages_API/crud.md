---
package: "@linch-kit/crud"
version: "2.0.2"
layer: "L3"
dependencies: ["@linch-kit/core", "@linch-kit/schema", "@linch-kit/auth"]
completeness: 85
test_coverage: 80
status: "production_ready"
document_type: "api_reference"
purpose: "Graph RAG knowledge base - 类型安全的CRUD操作包，支持复杂查询、权限集成、事务管理、缓存优化"
api_exports:
  - name: "CrudManager"
    type: "class"
    status: "stable"
  - name: "PrismaQueryBuilder"
    type: "class"
    status: "stable"
  - name: "PermissionChecker"
    type: "class"
    status: "stable"
  - name: "ValidationManager"
    type: "class"
    status: "stable"
  - name: "CacheManager"
    type: "class"
    status: "stable"
  - name: "createCrudManager"
    type: "function"
    status: "stable"
  - name: "createQueryBuilder"
    type: "function"
    status: "stable"
  - name: "BaseCrudPlugin"
    type: "class"
    status: "stable"
  - name: "createCrudRouter"
    type: "function"
    status: "stable"
relationships:
  - type: "depends_on"
    targets: ["@linch-kit/core", "@linch-kit/schema", "@linch-kit/auth"]
  - type: "provides_crud_for"
    targets: ["@linch-kit/trpc", "@linch-kit/ui"]
  - type: "integrates_with"
    targets: ["Prisma", "Redis", "tRPC"]
last_verified: "2025-07-07"
---

# @linch-kit/crud 包 API 文档

**版本**: 2.0.2  
**状态**: ✅ 生产就绪  
**架构层级**: L3 (依赖 @linch-kit/core、@linch-kit/schema、@linch-kit/auth)

## 概述

@linch-kit/crud 提供类型安全的 CRUD 操作包，支持复杂查询、权限集成、事务管理、缓存优化。设计原则是平衡封装便利性和 Prisma 原生灵活性，提供便捷的高层 API 同时保留 Prisma 原生访问能力。

### 核心特性

- **高层 CRUD API** - 简化的 CRUD 操作接口
- **Prisma 原生访问** - 完整的 Prisma 客户端访问权限
- **可选增强功能** - 权限检查、数据验证、缓存支持
- **插件扩展系统** - 通过插件钩子扩展功能
- **模块化架构** - 查询构建器、权限检查、验证管理等独立模块
- **tRPC 集成** - 提供类型安全的 API 路由工厂
- **CLI 支持** - CRUD 代码生成、数据库迁移、种子数据

## 依赖关系

```typescript
// 核心依赖
import type { Logger, PluginManager } from '@linch-kit/core'
import type { Entity, FieldDefinition, SchemaRegistry } from '@linch-kit/schema'  
import type { LinchKitUser, IPermissionChecker } from '@linch-kit/auth'

// 外部依赖
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import Redis from 'ioredis'
import LRUCache from 'lru-cache'
```

## 核心 API

### CrudManager - 主要管理器

**文件**: `src/core/crud-manager.ts`

```typescript
export class CrudManager {
  constructor(
    prisma: PrismaClient,
    schemaRegistry: SchemaRegistry,
    logger: Logger,
    pluginManager?: PluginManager,
    options?: CrudManagerOptions
  )

  // Prisma 原生访问
  get client(): PrismaClient
  model<T>(entityName: string): T

  // 便捷 CRUD 操作
  create<T>(entityName: string, data: CreateInput<T>, options?: CrudOptions): Promise<T>
  findMany<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T[]>
  findFirst<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T | null>
  findById<T>(entityName: string, id: string, options?: FindOptions): Promise<T | null>
  update<T>(entityName: string, id: string, data: UpdateInput<T>, options?: CrudOptions): Promise<T>
  delete(entityName: string, id: string, options?: CrudOptions): Promise<boolean>
  count(entityName: string, query?: QueryInput, options?: FindOptions): Promise<number>
  
  // 分页和批量操作
  paginate<T>(entityName: string, query?: QueryInput, page?: number, pageSize?: number, options?: FindOptions): Promise<PaginatedResult<T>>
  createMany<T>(entityName: string, data: CreateInput<T>[], options?: { skipDuplicates?: boolean }): Promise<{ count: number }>
  
  // 事务和原生查询
  transaction<T>(callback: (tx: PrismaClient) => Promise<T>, options?: TransactionOptions): Promise<T>
  queryRaw<T>(sql: string, ...params: unknown[]): Promise<T[]>
}

export interface CrudManagerOptions {
  enablePermissions?: boolean      // 启用权限检查 (默认: true)
  enableValidation?: boolean       // 启用数据验证 (默认: true)  
  enableCache?: boolean           // 启用缓存 (默认: true)
  enableAudit?: boolean           // 启用审计日志 (默认: true)
  enableMetrics?: boolean         // 启用性能指标 (默认: true)
  authPermissionChecker?: IPermissionChecker  // Auth包权限检查器
  pluginManager?: PluginManager   // 核心包插件管理器
}
```

### 查询构建器系统

**模块化设计** - `src/core/query-builder/`

#### PrismaQueryBuilder - 主查询构建器

```typescript
export class PrismaQueryBuilder<T = unknown> extends BaseQueryBuilder<T> {
  static create<T>(entityName: string, prisma: PrismaClient, schemaRegistry: SchemaRegistry, logger: Logger, pluginManager?: PluginManager): PrismaQueryBuilder<T>
  
  // 查询条件构建
  where(field: keyof T, operator: Operator, value: unknown): this
  whereIn(field: keyof T, values: unknown[]): this
  whereNull(field: keyof T): this
  whereNotNull(field: keyof T): this
  whereBetween(field: keyof T, min: unknown, max: unknown): this
  
  // 关联和排序
  include(relation: string): this
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): this
  
  // 分页和限制
  limit(count: number): this
  offset(count: number): this
  paginate(page: number, pageSize: number): this
  
  // 执行查询
  execute(): Promise<T[]>
  first(): Promise<T | null>
  count(): Promise<number>
  exists(): Promise<boolean>
  
  // 聚合查询
  sum(field: keyof T): Promise<number>
  avg(field: keyof T): Promise<number>
  min(field: keyof T): Promise<number>
  max(field: keyof T): Promise<number>
}
```

#### QueryConditionBuilder - 条件构建器

```typescript
export class QueryConditionBuilder {
  and(...conditions: WhereClause[]): this
  or(...conditions: WhereClause[]): this
  not(condition: WhereClause): this
  build(): Record<string, unknown>
}
```

#### QueryExecutor - 查询执行器

```typescript
export interface QueryExecutor {
  execute<T>(query: Record<string, unknown>, entityName: string): Promise<T[]>
  executeCount(query: Record<string, unknown>, entityName: string): Promise<number>
  executeAggregate(query: Record<string, unknown>, entityName: string, operation: AggregateOperation, field?: string): Promise<AggregateResult>
}

export const QueryExecutorFactory = {
  createPrismaExecutor(prisma: PrismaClient, logger: Logger): QueryExecutor
}
```

#### QueryOptimizer - 查询优化器

```typescript
export interface QueryOptimizer {
  optimize(query: Record<string, unknown>, entityName: string): Promise<Record<string, unknown>>
  analyzePerformance(query: Record<string, unknown>, entityName: string): Promise<PerformanceMetrics>
}

export function createQueryOptimizer(schemaRegistry: SchemaRegistry, logger: Logger): QueryOptimizer
```

#### QueryValidator - 查询验证器

```typescript
export interface QueryValidator {
  validate(query: QueryInput, entity: Entity): Promise<ValidationError[]>
  validateWhereClause(where: WhereClause[], entity: Entity): Promise<ValidationError[]>
  validateOrderBy(orderBy: OrderByClause[], entity: Entity): Promise<ValidationError[]>
}

export function createQueryValidator(schemaRegistry: SchemaRegistry, logger: Logger): QueryValidator
```

### 权限系统

**文件**: `src/permissions/permission-checker.ts`

```typescript
export class PermissionChecker implements IPermissionChecker {
  constructor(
    schemaRegistry: SchemaRegistry,
    logger: Logger,
    authPermissionChecker?: AuthPermissionChecker,
    pluginManager?: PluginManager
  )

  // 实体级权限检查
  checkCreate(entity: Entity, user: LinchKitUser, data: unknown): Promise<void>
  checkRead(entity: Entity, user: LinchKitUser, resource?: unknown): Promise<void>
  checkUpdate(entity: Entity, user: LinchKitUser, resource: unknown, data: unknown): Promise<void>
  checkDelete(entity: Entity, user: LinchKitUser, resource: unknown): Promise<void>

  // 字段级权限过滤  
  filterFields<T>(entity: Entity, user: LinchKitUser, data: T[], operation: 'read' | 'write'): Promise<Partial<T>[]>

  // 行级权限过滤
  buildRowFilter(entity: Entity, user: LinchKitUser, operation: 'read' | 'write' | 'delete'): Promise<Record<string, unknown>>
}
```

### 验证系统

**文件**: `src/validation/validation-manager.ts`

```typescript
export class ValidationManager implements IValidationManager {
  constructor(schemaRegistry: SchemaRegistry, logger: Logger)

  validateCreate(entity: Entity, data: unknown): Promise<ValidationError[]>
  validateUpdate(entity: Entity, id: string, data: unknown): Promise<ValidationError[]>  
  validateQuery(entity: Entity, query: QueryInput): Promise<ValidationError[]>
  validateField(field: FieldDefinition, value: unknown): Promise<ValidationError[]>
}
```

### 缓存系统  

**文件**: `src/cache/cache-manager.ts`

```typescript
export class CacheManager implements ICacheManager {
  constructor(logger: Logger, config?: CacheConfig)

  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  invalidate(pattern: string): Promise<void>
  clear(): Promise<void>
  generateKey(entityName: string, operation: string, params: unknown): string
}

export interface CacheConfig {
  enabled: boolean
  defaultTTL: number
  maxSize: number
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
    keyPrefix?: string
  }
  local?: {
    maxSize: number
    ttl: number
  }
}
```

## 插件系统

### 插件接口

**文件**: `src/plugins/types.ts`

```typescript
export interface CrudPlugin {
  name: string
  version: string
  description?: string
  dependencies?: string[]
  hooks?: CrudPluginHooks
  initialize?(): Promise<void>
  destroy?(): Promise<void>
  configure?(config: Record<string, unknown>): Promise<void>
}

export interface CrudPluginHooks {
  // 全局操作钩子
  beforeCreate?<T>(entityName: string, data: CreateInput<T>, context: HookContext): Promise<CreateInput<T>>
  afterCreate?<T>(entityName: string, result: T, context: HookContext): Promise<void>
  beforeUpdate?<T>(entityName: string, id: string, data: UpdateInput<T>, existing: unknown, context: HookContext): Promise<UpdateInput<T>>
  afterUpdate?<T>(entityName: string, result: T, existing: unknown, changes: FieldChange[], context: HookContext): Promise<void>
  beforeDelete?(entityName: string, id: string, existing: unknown, context: HookContext): Promise<void>
  afterDelete?(entityName: string, existing: unknown, context: HookContext): Promise<void>
  beforeQuery?(entityName: string, query: Record<string, unknown>, context: HookContext): Promise<Record<string, unknown>>
  afterQuery?<T>(entityName: string, results: T[], query: Record<string, unknown>, context: HookContext): Promise<T[]>

  // 验证钩子
  beforeValidation?(entityName: string, data: unknown, operation: 'create' | 'update', context: HookContext): Promise<unknown>
  afterValidation?(entityName: string, data: unknown, errors: unknown[], operation: 'create' | 'update', context: HookContext): Promise<void>

  // 权限钩子  
  beforePermissionCheck?(entityName: string, user: unknown, operation: string, resource?: unknown, context?: HookContext): Promise<void>
  afterPermissionCheck?(entityName: string, user: unknown, operation: string, allowed: boolean, resource?: unknown, context?: HookContext): Promise<void>

  // 缓存钩子
  beforeCacheGet?(key: string, entityName: string, context?: HookContext): Promise<string>
  afterCacheGet?<T>(key: string, entityName: string, value: T | null, context?: HookContext): Promise<T | null>
  beforeCacheSet?<T>(key: string, entityName: string, value: T, ttl?: number, context?: HookContext): Promise<{ key: string; value: T; ttl?: number }>
  afterCacheSet?<T>(key: string, entityName: string, value: T, ttl?: number, context?: HookContext): Promise<void>

  // 条件钩子
  onStatusChange?<T>(entityName: string, id: string, oldStatus: string, newStatus: string, entity: T, context: HookContext): Promise<void>
  onRelationChange?<T>(entityName: string, id: string, relationName: string, changeType: 'connect' | 'disconnect' | 'set', relatedIds: string[], entity: T, context: HookContext): Promise<void>
  onBatchOperation?<T>(entityName: string, operation: 'createMany' | 'updateMany' | 'deleteMany', affectedCount: number, results: T[], context: HookContext): Promise<void>
  onSoftDeleteRestore?<T>(entityName: string, id: string, entity: T, context: HookContext): Promise<void>
}
```

### 基础插件类

**文件**: `src/plugins/base-plugin.ts`

```typescript
export abstract class BaseCrudPlugin implements CrudPlugin {
  public readonly name: string
  public readonly version: string
  public readonly description?: string
  public readonly dependencies?: string[]

  constructor(metadata: Pick<PluginMetadata, 'name' | 'version' | 'description' | 'dependencies'>)

  abstract get hooks(): CrudPluginHooks

  setLogger(logger: Logger): this
  async initialize(): Promise<void>
  async destroy(): Promise<void>
  async configure(config: Record<string, unknown>): Promise<void>
  getConfig<T = Record<string, unknown>>(): T
  isInitialized(): boolean
  getMetadata(): PluginMetadata

  // 生命周期钩子 - 子类重写
  protected async onInitialize(): Promise<void>
  protected async onDestroy(): Promise<void>
  protected async onConfigure(config: Record<string, unknown>): Promise<void>
}
```

### 内置插件示例

**审计日志插件** - `src/plugins/examples/audit-log-plugin.ts`  
**用户活动插件** - `src/plugins/examples/user-activity-plugin.ts`

## tRPC 集成

**文件**: `src/trpc/router-factory.ts`

```typescript
export function createCrudRouter(trpc: TRPCRouterBuilder) {
  return router({
    // 通用查询
    findMany: protectedProcedure
      .input(z.object({
        model: z.string(),
        where: z.record(z.unknown()).optional(),
        orderBy: z.record(z.unknown()).optional(),
        take: z.number().optional(),
        skip: z.number().optional()
      }))
      .query(async ({ input, ctx }) => { /* 实现 */ }),

    // 通用创建
    create: protectedProcedure
      .input(z.object({
        model: z.string(),
        data: z.record(z.unknown())
      }))
      .mutation(async ({ input, ctx }) => { /* 实现 */ }),

    // 通用更新  
    update: protectedProcedure
      .input(z.object({
        model: z.string(),
        where: z.record(z.unknown()),
        data: z.record(z.unknown())
      }))
      .mutation(async ({ input, ctx }) => { /* 实现 */ }),

    // 通用删除
    delete: protectedProcedure
      .input(z.object({
        model: z.string(),
        where: z.record(z.unknown())
      }))
      .mutation(async ({ input, ctx }) => { /* 实现 */ }),

    // 统计查询
    count: protectedProcedure
      .input(z.object({
        model: z.string(),
        where: z.record(z.unknown()).optional()
      }))
      .query(async ({ input, ctx }) => { /* 实现 */ })
  })
}
```

## CLI 命令

**文件**: `src/cli/commands.ts`

```typescript
export const crudCommands: CLICommand[] = [
  generateCrudCommand,    // crud:generate - 生成CRUD代码
  migrateCrudCommand,     // crud:migrate - 数据库迁移
  seedCrudCommand,        // crud:seed - 种子数据
]

// CRUD代码生成命令
export const generateCrudCommand: CLICommand = {
  name: 'crud:generate',
  description: 'Generate CRUD operations from schema definitions',
  category: 'crud',
  options: [
    { name: '--schema', alias: '-s', description: 'Schema file or directory', defaultValue: './src/schema' },
    { name: '--output', alias: '-o', description: 'Output directory for generated CRUD files', defaultValue: './src/crud' },
    { name: '--provider', alias: '-p', description: 'Database provider (prisma, drizzle, etc.)', defaultValue: 'prisma' },
    { name: '--permissions', description: 'Generate with permission checks', type: 'boolean', defaultValue: true },
    { name: '--validation', description: 'Generate with validation', type: 'boolean', defaultValue: true },
    { name: '--cache', description: 'Generate with caching support', type: 'boolean' },
  ],
  handler: async (context: CLIContext) => { /* 实现 */ }
}

// 数据库迁移命令
export const migrateCrudCommand: CLICommand = {
  name: 'crud:migrate',
  description: 'Run database migrations',
  category: 'crud',
  options: [
    { name: '--provider', alias: '-p', description: 'Database provider (prisma, drizzle, etc.)', defaultValue: 'prisma' },
    { name: '--reset', description: 'Reset database before migration', type: 'boolean' },
    { name: '--seed', description: 'Run seed after migration', type: 'boolean' },
    { name: '--force', description: 'Force migration in production', type: 'boolean' },
  ],
  handler: async (context: CLIContext) => { /* 实现 */ }
}

// 种子数据命令
export const seedCrudCommand: CLICommand = {
  name: 'crud:seed',
  description: 'Seed database with initial data',
  category: 'crud',
  options: [
    { name: '--file', alias: '-f', description: 'Specific seed file to run' },
    { name: '--env', alias: '-e', description: 'Environment for seeding', defaultValue: 'development' },
    { name: '--reset', description: 'Reset data before seeding', type: 'boolean' },
  ],
  handler: async (context: CLIContext) => { /* 实现 */ }
}
```

## 工厂函数

**文件**: `src/factory.ts`

```typescript
// 创建 CRUD 管理器
export function createCrudManager(
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger,
  options?: CrudManagerOptions & { pluginManager?: PluginManager }
): CrudManager

// 创建查询构建器
export function createQueryBuilder<T = unknown>(
  entityName: string,
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger,
  pluginManager?: PluginManager
): PrismaQueryBuilder<T>

// 创建带默认配置的 CRUD 管理器
export function createDefaultCrudManager(
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger,
  pluginManager?: PluginManager
): CrudManager

// 创建最小化 CRUD 管理器（仅基础功能）
export function createMinimalCrudManager(
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger
): CrudManager
```

## 类型定义

**文件**: `src/types/index.ts`

### 核心类型

```typescript
// 查询相关
export type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'in' | 'not_in' | 'is_null' | 'is_not_null' | 'between'

export interface WhereClause {
  field: string
  operator: Operator
  value: unknown
}

export interface OrderByClause {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryInput {
  where?: WhereClause[]
  orderBy?: OrderByClause[]
  include?: string[]
  limit?: number
  offset?: number
  distinct?: string[]
}

// 分页相关
export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationInfo
}

// 操作选项
export interface CrudOptions {
  skipPermissions?: boolean    // 跳过权限检查
  skipValidation?: boolean     // 跳过数据验证
  user?: LinchKitUser         // 操作用户
  tenantId?: string           // 租户ID
  source?: string             // 操作来源
  useCache?: boolean          // 启用缓存
  cacheTTL?: number           // 缓存TTL（秒）
  auditId?: string            // 审计日志标识
}

export interface FindOptions extends CrudOptions {
  includeSoftDeleted?: boolean  // 启用软删除过滤
  includeCount?: boolean       // 返回总数
}

export interface BatchOptions extends CrudOptions {
  skipDuplicates?: boolean     // 跳过重复记录
  returnRecords?: boolean      // 返回创建的记录
  batchSize?: number          // 批量大小
}

export interface UpsertOptions extends CrudOptions {
  include?: Record<string, boolean>  // 包含关联数据
}

// 输入类型
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
export type UpsertInput<T extends { id: unknown }> = Partial<T> & Pick<T, 'id'>

// 聚合类型
export type AggregateOperation = 'count' | 'sum' | 'avg' | 'min' | 'max'

export interface AggregateResult {
  operation: AggregateOperation
  field?: string
  value: number
}
```

### 错误类型

```typescript
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly resource?: string,
    public readonly field?: string
  )
}

export class ValidationException extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationError[]
  )
}
```

### 接口定义

```typescript
export interface ICrudManager {
  create<T>(entityName: string, data: CreateInput<T>, options?: CrudOptions): Promise<T>
  findById<T>(entityName: string, id: string, options?: FindOptions): Promise<T | null>
  findMany<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T[]>
  findOne<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T | null>
  update<T>(entityName: string, id: string, data: UpdateInput<T>, options?: CrudOptions): Promise<T>
  delete(entityName: string, id: string, options?: CrudOptions): Promise<boolean>
  count(entityName: string, query?: QueryInput, options?: FindOptions): Promise<number>
  exists(entityName: string, query?: QueryInput, options?: FindOptions): Promise<boolean>
  paginate<T>(entityName: string, query?: QueryInput, page?: number, pageSize?: number, options?: FindOptions): Promise<PaginatedResult<T>>
}

export interface IQueryBuilder<T = unknown> {
  where(field: keyof T, operator: Operator, value: unknown): this
  whereIn(field: keyof T, values: unknown[]): this
  whereNull(field: keyof T): this
  whereNotNull(field: keyof T): this
  whereBetween(field: keyof T, min: unknown, max: unknown): this
  include(relation: string): this
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  paginate(page: number, pageSize: number): this
  execute(): Promise<T[]>
  first(): Promise<T | null>
  count(): Promise<number>
  exists(): Promise<boolean>
  sum(field: keyof T): Promise<number>
  avg(field: keyof T): Promise<number>
  min(field: keyof T): Promise<number>
  max(field: keyof T): Promise<number>
}

export interface IBatchOperations {
  createMany<T>(entityName: string, data: CreateInput<T>[], options?: BatchOptions): Promise<T[]>
  updateMany<T>(entityName: string, query: QueryInput, data: UpdateInput<T>, options?: BatchOptions): Promise<number>
  deleteMany(entityName: string, query: QueryInput, options?: BatchOptions): Promise<number>
  upsertMany<T extends { id: unknown }>(entityName: string, data: UpsertInput<T>[], options?: UpsertOptions): Promise<T[]>
}

export interface ICacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  invalidate(pattern: string): Promise<void>
  clear(): Promise<void>
  generateKey(entityName: string, operation: string, params: unknown): string
}

export interface IPermissionChecker {
  checkCreate(entity: Entity, user: LinchKitUser, data: unknown): Promise<void>
  checkRead(entity: Entity, user: LinchKitUser, resource?: unknown): Promise<void>
  checkUpdate(entity: Entity, user: LinchKitUser, resource: unknown, data: unknown): Promise<void>
  checkDelete(entity: Entity, user: LinchKitUser, resource: unknown): Promise<void>
  filterFields<T>(entity: Entity, user: LinchKitUser, data: T[], operation: 'read' | 'write'): Promise<Partial<T>[]>
  buildRowFilter(entity: Entity, user: LinchKitUser, operation: 'read' | 'write' | 'delete'): Promise<Record<string, unknown>>
}

export interface IValidationManager {
  validateCreate(entity: Entity, data: unknown): Promise<ValidationError[]>
  validateUpdate(entity: Entity, id: string, data: unknown): Promise<ValidationError[]>
  validateQuery(entity: Entity, query: QueryInput): Promise<ValidationError[]>
  validateField(field: FieldDefinition, value: unknown): Promise<ValidationError[]>
}
```

## 使用示例

### 基础使用

```typescript
import { createCrudManager } from '@linch-kit/crud'
import { CASLPermissionEngine } from '@linch-kit/auth'
import { PrismaClient } from '@prisma/client'
import { createLogger } from '@linch-kit/core'
import { SchemaRegistry } from '@linch-kit/schema'

// 初始化依赖
const prisma = new PrismaClient()
const logger = createLogger({ name: 'crud' })
const schemaRegistry = new SchemaRegistry()

// 创建权限检查器（与 @linch-kit/auth 集成）
const authPermissionChecker = new CASLPermissionEngine()

// 创建 CRUD 管理器
const crudManager = createCrudManager(prisma, schemaRegistry, logger, {
  enablePermissions: true,
  enableValidation: true,
  enableCache: true,
  authPermissionChecker // 集成 Auth 包的权限检查器
})

// 使用便捷 API
const user = await crudManager.create('User', {
  name: 'John Doe',
  email: 'john@example.com'
}, { user: currentUser })

const users = await crudManager.findMany('User', {
  where: [
    { field: 'status', operator: '=', value: 'active' }
  ],
  orderBy: [
    { field: 'createdAt', direction: 'desc' }
  ],
  limit: 10
})

// 使用原生 Prisma API
const advancedQuery = await crudManager.client.user.findMany({
  where: {
    OR: [
      { email: { contains: '@company.com' } },
      { role: 'admin' }
    ]
  },
  include: {
    posts: true,
    profile: true
  }
})
```

### 查询构建器使用

```typescript
import { createQueryBuilder } from '@linch-kit/crud'

const queryBuilder = createQueryBuilder<User>('User', prisma, schemaRegistry, logger)

const users = await queryBuilder
  .where('status', '=', 'active')
  .whereIn('role', ['admin', 'moderator'])
  .include('profile')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .execute()

const userCount = await queryBuilder
  .where('createdAt', '>', new Date('2024-01-01'))
  .count()

const avgAge = await queryBuilder
  .where('status', '=', 'active')
  .avg('age')
```

### 分页查询

```typescript
const result = await crudManager.paginate('User', {
  where: [
    { field: 'status', operator: '=', value: 'active' }
  ]
}, 1, 20, { user: currentUser })

console.log(`Found ${result.pagination.total} users`)
console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`)
console.log(result.data) // 当前页数据
```

### 事务使用

```typescript
const result = await crudManager.transaction(async (tx) => {
  const user = await tx.user.create({
    data: { name: 'John', email: 'john@example.com' }
  })
  
  await tx.profile.create({
    data: { userId: user.id, bio: 'A developer' }
  })
  
  return user
})
```

### 插件开发

```typescript
import { BaseCrudPlugin } from '@linch-kit/crud'

class AuditLogPlugin extends BaseCrudPlugin {
  constructor() {
    super({
      name: 'audit-log',
      version: '1.0.0',
      description: 'Audit log plugin for CRUD operations'
    })
  }

  get hooks() {
    return {
      afterCreate: async (entityName, result, context) => {
        this.log('info', `Created ${entityName}`, { 
          entityId: result.id,
          userId: context.user?.id 
        })
      },
      
      afterUpdate: async (entityName, result, existing, changes, context) => {
        this.log('info', `Updated ${entityName}`, {
          entityId: result.id,
          changes: changes.map(c => c.fieldName),
          userId: context.user?.id
        })
      }
    }
  }

  protected async onInitialize() {
    // 初始化审计日志存储
  }
}

// 注册插件
const pluginManager = new PluginManager()
await pluginManager.register(new AuditLogPlugin())

const crudManager = createCrudManager(prisma, schemaRegistry, logger, {
  pluginManager
})
```

### tRPC 路由集成

```typescript
import { createTRPCRouter, protectedProcedure } from '@linch-kit/trpc'
import { createCrudRouter } from '@linch-kit/crud'

export const appRouter = createTRPCRouter({
  // 通用 CRUD 路由
  crud: createCrudRouter({ router: createTRPCRouter, protectedProcedure }),
  
  // 自定义路由
  users: createTRPCRouter({
    getProfile: protectedProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input, ctx }) => {
        return crudManager.findById('User', input.userId, {
          user: ctx.user,
          include: ['profile']
        })
      })
  })
})
```

### 深度 Auth 集成示例

```typescript
import { createCrudManager } from '@linch-kit/crud'
import { CASLPermissionEngine, type LinchKitUser } from '@linch-kit/auth'
import { PluginManager } from '@linch-kit/core'

// 完整的权限集成设置
const authPermissionChecker = new CASLPermissionEngine()
const pluginManager = new PluginManager()

const crudManager = createCrudManager(prisma, schemaRegistry, logger, {
  enablePermissions: true,
  enableValidation: true,
  enableCache: true,
  authPermissionChecker,
  pluginManager
})

// 带用户权限的操作
const currentUser: LinchKitUser = {
  id: 'user123',
  email: 'user@example.com',
  roles: ['editor'],
  tenantId: 'tenant1'
}

// 自动权限检查和字段过滤
const posts = await crudManager.findMany('Post', {
  where: [{ field: 'status', operator: '=', value: 'published' }]
}, { 
  user: currentUser,  // 自动应用用户权限
  tenantId: 'tenant1' // 多租户隔离
})

// 创建时的权限验证
try {
  const newPost = await crudManager.create('Post', {
    title: 'My New Post',
    content: 'Post content...',
    status: 'draft'
  }, { user: currentUser })
} catch (error) {
  if (error instanceof PermissionError) {
    console.log('权限被拒绝:', error.message)
  }
}

// 行级权限过滤示例
const userPosts = await crudManager.findMany('Post', {
  where: [{ field: 'authorId', operator: '=', value: currentUser.id }]
}, { 
  user: currentUser,
  // 权限检查器会自动添加行级过滤条件
  // 只返回用户有权限访问的记录
})
```

### CLI 使用

```bash
# 生成 CRUD 代码
linch crud:generate --schema ./src/schema --output ./src/generated

# 运行数据库迁移
linch crud:migrate --provider prisma --seed

# 运行种子数据
linch crud:seed --env development --reset
```

## 架构约束

### 1. 依赖层级严格控制
- 只能依赖 L0 (@linch-kit/core)、L1 (@linch-kit/schema)、L2 (@linch-kit/auth) 层级包
- 不能依赖同级或更高级包 (@linch-kit/trpc、@linch-kit/ui)

### 2. Prisma 原生能力保留
- 必须提供完整的 Prisma 客户端访问权限 (`manager.client`)
- 必须提供原生模型访问 (`manager.model()`)
- 事务、原生查询等高级功能必须可用

### 3. 可选增强设计
- 权限、验证、缓存等功能都是可选的
- 用户可以完全跳过这些增强功能直接使用 Prisma
- 提供从简单到复杂的渐进式使用方式

### 4. 类型安全保障
- 所有 API 必须提供完整的 TypeScript 类型支持
- 查询构建器必须提供类型安全的字段访问
- 错误处理必须有明确的类型定义

### 5. 插件系统扩展性
- 通过插件钩子系统提供扩展能力
- 插件必须与核心功能松耦合
- 支持异步插件钩子执行

## 重要注意事项

### 1. 性能考虑
- 查询优化器可以分析和改进查询性能
- 缓存系统支持 Redis 和本地缓存
- 支持分页查询避免大数据集问题

### 2. 安全特性
- 权限检查器与 @linch-kit/auth 深度集成
- 支持实体级、行级、字段级权限控制
- 自动过滤敏感数据

### 3. 验证功能
- 与 @linch-kit/schema 集成进行数据验证
- 支持创建、更新、查询等不同场景的验证
- 提供详细的验证错误信息

### 4. 扩展性设计
- 插件系统支持全局、实体级、字段级钩子
- CLI 命令支持代码生成和数据库管理
- tRPC 集成提供类型安全的 API

### 5. 开发体验
- 提供工厂函数简化初始化
- 支持最小化配置和全功能配置
- 完整的 TypeScript 类型支持和 IntelliSense

这个包是 LinchKit 架构中的关键数据访问层，为上层的 tRPC API 和 UI 组件提供了强大而灵活的数据操作能力。