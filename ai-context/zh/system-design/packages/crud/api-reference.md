# @linch-kit/crud API 参考

## 💾 CRUD管理器

### CrudManager
```typescript
export class CrudManager<T = any> {
  // 创建记录
  static async create<T>(
    entityName: string, 
    data: CreateInput<T>, 
    options?: CrudOptions
  ): Promise<T>
  
  // 根据ID查找
  static async findById<T>(
    entityName: string, 
    id: string, 
    options?: FindOptions
  ): Promise<T | null>
  
  // 查找多条记录
  static async findMany<T>(
    entityName: string, 
    query?: QueryInput, 
    options?: FindOptions
  ): Promise<T[]>
  
  // 更新记录
  static async update<T>(
    entityName: string, 
    id: string, 
    data: UpdateInput<T>, 
    options?: CrudOptions
  ): Promise<T>
  
  // 删除记录
  static async delete(
    entityName: string, 
    id: string, 
    options?: CrudOptions
  ): Promise<boolean>
}
```

## 🔍 查询构建器

### QueryBuilder
```typescript
export class QueryBuilder<T = any> {
  // 指定表/实体
  static from<T>(entityName: string): QueryBuilder<T>
  
  // 条件过滤
  where(field: keyof T, operator: Operator, value: any): this
  whereIn(field: keyof T, values: any[]): this
  whereNull(field: keyof T): this
  whereNotNull(field: keyof T): this
  
  // 关联查询
  include(relation: string, callback?: (qb: QueryBuilder) => void): this
  leftJoin(table: string, condition: string): this
  
  // 排序和分页
  orderBy(field: keyof T, direction: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  paginate(page: number, pageSize: number): this
  
  // 聚合操作
  count(field?: keyof T): this
  sum(field: keyof T): this
  avg(field: keyof T): this
  min(field: keyof T): this
  max(field: keyof T): this
  
  // 执行查询
  execute(): Promise<T[]>
  first(): Promise<T | null>
  exists(): Promise<boolean>
}

export type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'ilike'
```

## 📊 批量操作

### BatchOperations
```typescript
export class BatchOperations {
  // 批量创建
  static async createMany<T>(
    entityName: string, 
    data: CreateInput<T>[], 
    options?: BatchOptions
  ): Promise<T[]>
  
  // 批量更新
  static async updateMany<T>(
    entityName: string, 
    query: QueryInput, 
    data: UpdateInput<T>, 
    options?: BatchOptions
  ): Promise<number>
  
  // 批量删除
  static async deleteMany(
    entityName: string, 
    query: QueryInput, 
    options?: BatchOptions
  ): Promise<number>
  
  // 批量上传
  static async upsertMany<T>(
    entityName: string, 
    data: UpsertInput<T>[], 
    options?: UpsertOptions
  ): Promise<T[]>
}
```

## 🔐 权限集成

### PermissionAwareCrud
```typescript
export class PermissionAwareCrud<T = any> {
  // 带权限检查的查询
  static async findWithPermissions<T>(
    entityName: string,
    user: User,
    query?: QueryInput,
    options?: PermissionOptions
  ): Promise<T[]>
  
  // 字段级权限过滤
  static async applyFieldPermissions<T>(
    entity: T,
    user: User,
    operation: 'read' | 'write'
  ): Promise<Partial<T>>
}

export interface PermissionOptions {
  checkRead?: boolean
  checkWrite?: boolean
  filterFields?: boolean
  context?: Record<string, any>
}
```

## 🔄 事务管理

### TransactionManager
```typescript
export class TransactionManager {
  // 开启事务
  static async beginTransaction(): Promise<Transaction>
  
  // 在事务中执行
  static async withTransaction<T>(
    callback: (tx: Transaction) => Promise<T>
  ): Promise<T>
  
  // 提交事务
  static async commit(transaction: Transaction): Promise<void>
  
  // 回滚事务
  static async rollback(transaction: Transaction): Promise<void>
}

export interface Transaction {
  id: string
  isActive: boolean
  commit(): Promise<void>
  rollback(): Promise<void>
}
```

## 📈 数据验证

### ValidationManager
```typescript
export class ValidationManager {
  // 验证创建数据
  static async validateCreate<T>(
    entityName: string, 
    data: CreateInput<T>
  ): Promise<ValidationResult>
  
  // 验证更新数据
  static async validateUpdate<T>(
    entityName: string, 
    id: string, 
    data: UpdateInput<T>
  ): Promise<ValidationResult>
  
  // 自定义验证规则
  static addValidator(
    entityName: string, 
    validator: CustomValidator
  ): void
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
```

## 🏗️ 基础类型

```typescript
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInput<T> = Partial<CreateInput<T>>
export type UpsertInput<T> = CreateInput<T> & { id?: string }

export interface QueryInput {
  where?: WhereClause[]
  orderBy?: OrderByClause[]
  include?: string[]
  limit?: number
  offset?: number
}

export interface CrudOptions {
  transaction?: Transaction
  user?: User
  skipPermissions?: boolean
  skipValidation?: boolean
  skipAudit?: boolean
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```