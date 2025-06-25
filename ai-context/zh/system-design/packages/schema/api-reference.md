# @linch-kit/schema API 参考

## 🏗️ Schema定义

### defineEntity
```typescript
export function defineEntity<T>(
  name: string, 
  definition: EntityDefinition<T>
): Entity<T>

interface EntityDefinition<T> {
  fields: Record<keyof T, FieldDefinition>
  options?: EntityOptions
}

interface EntityOptions {
  tableName?: string
  timestamps?: boolean
  softDelete?: boolean
  permissions?: PermissionConfig
}
```

### FieldDefinition
```typescript
export interface FieldDefinition {
  type: FieldType
  required?: boolean
  unique?: boolean
  index?: boolean
  default?: any
  validation?: ValidationRule[]
  permissions?: FieldPermissions
  i18n?: boolean
}

export type FieldType = 
  | 'string' | 'number' | 'boolean' | 'date'
  | 'email' | 'url' | 'uuid' | 'json'
  | 'relation' | 'enum' | 'array'
```

## 🔧 代码生成

### CodeGenerator
```typescript
export class CodeGenerator {
  // 生成TypeScript类型
  static generateTypes(entities: Entity[]): Promise<GeneratedFile[]>
  
  // 生成Prisma模型
  static generatePrisma(entities: Entity[]): Promise<string>
  
  // 生成API路由
  static generateRoutes(entities: Entity[]): Promise<GeneratedFile[]>
  
  // 生成验证Schema
  static generateValidation(entities: Entity[]): Promise<GeneratedFile[]>
}

interface GeneratedFile {
  path: string
  content: string
  type: 'types' | 'prisma' | 'api' | 'validation'
}
```

## ✅ 数据验证

### ValidationRule
```typescript
export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message?: string
  condition?: (value: any) => boolean
}

// 内置验证器
export const Validators = {
  email: (message?: string) => ValidationRule
  url: (message?: string) => ValidationRule
  min: (value: number, message?: string) => ValidationRule
  max: (value: number, message?: string) => ValidationRule
  pattern: (regex: RegExp, message?: string) => ValidationRule
}
```

## 🔄 Schema迁移

### MigrationManager
```typescript
export class MigrationManager {
  // 生成迁移文件
  static generateMigration(
    oldSchema: Entity[], 
    newSchema: Entity[]
  ): Promise<Migration>
  
  // 执行迁移
  static runMigration(migration: Migration): Promise<void>
  
  // 回滚迁移
  static rollbackMigration(migrationId: string): Promise<void>
}

interface Migration {
  id: string
  operations: MigrationOperation[]
  sql: string
}
```

## 🌐 国际化集成

### I18nSchema
```typescript
export interface I18nFieldConfig {
  locales: string[]
  fallback?: string
  required?: string[]
}

// 多语言字段定义
export function i18nField(config: I18nFieldConfig): FieldDefinition
export function translateSchema(entity: Entity, locale: string): Entity
```

## 🔐 权限集成

### PermissionConfig
```typescript
export interface PermissionConfig {
  read?: PermissionRule[]
  write?: PermissionRule[]
  delete?: PermissionRule[]
}

export interface FieldPermissions {
  read?: PermissionRule[]
  write?: PermissionRule[]
}

export interface PermissionRule {
  role?: string
  condition?: string
  fields?: string[]
}
```

## 🏗️ 基础类型

```typescript
export interface Entity<T = any> {
  name: string
  fields: Record<keyof T, FieldDefinition>
  options: EntityOptions
  
  // 类型推导方法
  getCreateType(): CreateInput<T>
  getUpdateType(): UpdateInput<T>
  getReadType(): T
}

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInput<T> = Partial<CreateInput<T>>

export interface SchemaContext {
  entities: Map<string, Entity>
  generators: CodeGenerator[]
  validators: ValidationRule[]
}
```