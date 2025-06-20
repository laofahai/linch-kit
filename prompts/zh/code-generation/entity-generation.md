# Linch Kit 实体生成提示词

## 目的
指导AI助手生成符合Linch Kit规范的实体定义，确保生成的实体具有完整的类型安全、验证规则和数据库映射。

## 上下文
Linch Kit使用装饰器模式定义实体，支持：
- 类型安全的字段定义
- 自动数据库schema生成
- 内置验证规则
- 软删除支持
- 索引优化
- 关系映射

## 实体生成模板

### 基础实体结构
```typescript
/**
 * @ai-context {EntityName} Entity
 * @ai-purpose {实体用途描述}
 * @ai-features {特性列表}
 */

import { Entity, Field } from '@linch-kit/schema'

@Entity({
  name: '{EntityName}',
  description: '{实体描述}',
  tableName: '{table_name}',
  softDelete: true,
  indexes: [
    // 索引定义
  ]
})
export class {EntityName} {
  // 字段定义
}
```

### 字段类型映射

#### 字符串字段
```typescript
@Field({
  type: 'string',
  required: true,
  description: '字段描述',
  validation: {
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9]+$/ // 可选
  }
})
fieldName: string
```

#### 数字字段
```typescript
@Field({
  type: 'number',
  required: true,
  description: '字段描述',
  validation: {
    min: 0,
    max: 999999,
    integer: true // 可选，表示整数
  }
})
fieldName: number
```

#### 布尔字段
```typescript
@Field({
  type: 'boolean',
  defaultValue: true,
  description: '字段描述'
})
fieldName: boolean
```

#### 日期字段
```typescript
@Field({
  type: 'datetime',
  defaultValue: 'now',
  description: '字段描述'
})
fieldName: Date
```

#### JSON字段
```typescript
@Field({
  type: 'json',
  description: '字段描述'
})
fieldName?: Record<string, any>
```

#### 枚举字段
```typescript
@Field({
  type: 'enum',
  enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
  defaultValue: 'ACTIVE',
  description: '字段描述'
})
status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
```

### 关系字段

#### 一对多关系
```typescript
@Field({
  type: 'relation',
  relation: {
    type: 'one-to-many',
    target: 'RelatedEntity',
    foreignKey: 'parentId'
  },
  description: '关系描述'
})
children?: RelatedEntity[]
```

#### 多对一关系
```typescript
@Field({
  type: 'relation',
  relation: {
    type: 'many-to-one',
    target: 'ParentEntity',
    foreignKey: 'parentId'
  },
  description: '关系描述'
})
parent?: ParentEntity

@Field({
  type: 'string',
  description: '父实体ID'
})
parentId?: string
```

### 索引配置

#### 单字段索引
```typescript
indexes: [
  { fields: ['name'], unique: false },
  { fields: ['email'], unique: true },
  { fields: ['createdAt'], unique: false }
]
```

#### 复合索引
```typescript
indexes: [
  { fields: ['userId', 'type'], unique: true },
  { fields: ['category', 'isActive'], unique: false }
]
```

## 常见实体模式

### 1. 用户实体
```typescript
@Entity({
  name: 'User',
  description: 'User account entity',
  tableName: 'users',
  softDelete: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['isActive'], unique: false }
  ]
})
export class User {
  @Field({
    type: 'string',
    required: true,
    description: 'User email address',
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 255
    }
  })
  email: string

  @Field({
    type: 'string',
    required: true,
    description: 'Username',
    validation: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/
    }
  })
  username: string

  @Field({
    type: 'string',
    description: 'User display name',
    validation: {
      maxLength: 100
    }
  })
  displayName?: string

  @Field({
    type: 'boolean',
    defaultValue: true,
    description: 'Is user account active'
  })
  isActive: boolean
}
```

### 2. 产品实体
```typescript
@Entity({
  name: 'Product',
  description: 'Product entity for e-commerce',
  tableName: 'products',
  softDelete: true,
  indexes: [
    { fields: ['name'], unique: false },
    { fields: ['sku'], unique: true },
    { fields: ['category'], unique: false },
    { fields: ['isActive'], unique: false }
  ]
})
export class Product {
  @Field({
    type: 'string',
    required: true,
    description: 'Product name',
    validation: {
      minLength: 1,
      maxLength: 255
    }
  })
  name: string

  @Field({
    type: 'string',
    description: 'Product SKU',
    validation: {
      maxLength: 50,
      pattern: /^[A-Z0-9-]+$/
    }
  })
  sku?: string

  @Field({
    type: 'number',
    required: true,
    description: 'Product price in cents',
    validation: {
      min: 0,
      integer: true
    }
  })
  price: number

  @Field({
    type: 'enum',
    enum: ['ELECTRONICS', 'CLOTHING', 'BOOKS', 'HOME'],
    description: 'Product category'
  })
  category?: 'ELECTRONICS' | 'CLOTHING' | 'BOOKS' | 'HOME'

  @Field({
    type: 'boolean',
    defaultValue: true,
    description: 'Is product active'
  })
  isActive: boolean
}
```

## 生成规则

### 1. 命名约定
- 实体名使用PascalCase
- 字段名使用camelCase
- 表名使用snake_case
- 常量使用UPPER_CASE

### 2. 必需字段
- 所有实体都应该有id字段（自动生成）
- 包含createdAt和updatedAt字段（自动生成）
- 如果启用软删除，包含deletedAt字段

### 3. 验证规则
- 字符串字段应该有长度限制
- 数字字段应该有范围限制
- 邮箱字段使用邮箱格式验证
- URL字段使用URL格式验证

### 4. 索引策略
- 唯一字段创建唯一索引
- 经常查询的字段创建普通索引
- 外键字段创建索引
- 复合查询创建复合索引

## 最佳实践

1. **类型安全**: 使用严格的TypeScript类型
2. **验证完整**: 为所有字段添加适当的验证规则
3. **性能优化**: 合理设计索引
4. **文档清晰**: 为每个字段添加描述
5. **关系明确**: 正确定义实体间关系
6. **扩展性**: 考虑未来的扩展需求
