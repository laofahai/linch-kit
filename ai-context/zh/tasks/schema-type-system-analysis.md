# Schema 包类型系统改进分析

## 🎯 问题背景

### 原始问题
- **症状**: defineEntity 和 defineField 函数导致 TypeScript DTS 构建挂起(>30秒)
- **影响**: Auth 包无法完成构建，开发体验严重受损
- **根因**: 复杂的泛型类型推导导致 TypeScript 编译器进入无限递归

### 问题根源分析

#### 1. FieldConfig 接口复杂度
```typescript
// 问题代码示例
export interface FieldConfig {
  // 基础配置
  primary?: boolean
  unique?: boolean
  
  // 复杂嵌套对象
  table?: {
    width?: number | string
    render?: string
    // ... 20+ 属性
  }
  
  // 复杂函数类型
  transform?: {
    input?: (value: any) => any
    output?: (value: any) => any
  }
  
  // 深度嵌套配置
  form?: {
    dependencies?: Array<{
      field: string
      condition: any
      action: 'show' | 'hide' | 'enable' | 'disable' | 'require'
    }>
    // ... 更多嵌套
  }
}
```

#### 2. 复杂泛型推导链
```typescript
// 问题代码示例
export function defineField<T extends z.ZodSchema>(
  schema: T, 
  config?: FieldConfig  // 复杂接口导致推导爆炸
): T

export function defineEntity<T extends Record<string, z.ZodSchema>>(
  name: string,
  fields: T,
  config?: ModelConfig
): Entity<z.infer<z.ZodObject<T>>>  // 深度嵌套推导
```

## 🔧 解决方案设计

### 分层类型系统架构

#### 1. 核心层 (CoreFieldConfig)
```typescript
export interface CoreFieldConfig {
  // 只包含最基础的数据库相关配置
  primary?: boolean
  unique?: boolean
  default?: unknown
  map?: string
  updatedAt?: boolean
  createdAt?: boolean
  softDelete?: boolean
}
```

#### 2. 简化层 (SimpleFieldConfig)
```typescript
export interface SimpleFieldConfig extends CoreFieldConfig, BasicUIConfig, ValidationConfig {
  // 推荐使用的配置，平衡功能和性能
  db?: DatabaseFieldConfig
  relation?: RelationConfig
}
```

#### 3. 完整层 (FieldConfig)
```typescript
export interface FieldConfig extends Omit<SimpleFieldConfig, 'errorMessages'> {
  // 包含所有高级功能，但可能影响 DTS 性能
  table?: ComplexTableConfig
  form?: ComplexFormConfig
  permissions?: ComplexPermissionConfig
  // ...
}
```

### 函数重新设计

#### 1. defineField 优化
```typescript
// 默认版本 - 推荐使用
export function defineField<T extends z.ZodSchema>(
  schema: T, 
  config?: SimpleFieldConfig
): T

// 高级版本 - 完整功能
export function defineFieldAdvanced<T extends z.ZodSchema>(
  schema: T, 
  config?: FieldConfig
): T
```

#### 2. defineEntity 改进
```typescript
export function defineEntity<T extends Record<string, z.ZodSchema>>(
  name: string,
  fields: T,
  config?: EntityConfig
): Entity {
  // 使用 Zod 的 object 方法，但限制泛型深度
  const zodSchema = z.object(fields)
  
  // 简化元数据收集，避免复杂推导
  const entitySchema = zodSchema as EntitySchema
  // ...
}
```

## 📊 性能改进结果

### 构建时间对比
| 测试场景 | 修复前 | 临时方案 | 改进方案 | 改善程度 |
|---------|--------|----------|----------|----------|
| Schema 包 DTS | 挂起(>30s) | 4.6s | 4.8s | 84% ✅ |
| 简单 defineField | 挂起(>30s) | 1.1s | 正常 | 100% ✅ |
| 复杂嵌套对象 | 挂起(>30s) | 1.4s | 正常 | 100% ✅ |

### 类型安全对比
| 功能 | 修复前 | 临时方案 | 改进方案 |
|------|--------|----------|----------|
| 编译时类型检查 | ✅ | ❌ | ✅ |
| IDE 智能提示 | ✅ | ❌ | ✅ |
| 运行时验证 | ✅ | ✅ | ✅ |
| 类型推导精度 | ✅ | ❌ | ✅ |

## 🎯 技术原理

### 1. 分离关注点
- **数据库配置**: 独立的 DatabaseFieldConfig
- **UI 配置**: 分离的 BasicUIConfig 和复杂 UI 配置
- **验证配置**: 独立的 ValidationConfig
- **关系配置**: 独立的 RelationConfig

### 2. 条件类型使用
```typescript
// 使用条件类型限制推导深度
export type InferEntityType<T extends Record<string, z.ZodSchema>> = 
  T extends Record<string, z.ZodSchema> 
    ? { [K in keyof T]: z.infer<T[K]> }
    : never
```

### 3. 泛型约束优化
```typescript
// 避免过度复杂的泛型约束
export function withFieldMeta<T extends z.ZodSchema>(
  schema: T, 
  attributes: FieldAttributes
): T {
  // 保持输入输出类型一致，避免复杂推导
}
```

## 🔍 验证方法

### 1. 构建性能测试
```bash
# Schema 包构建测试
cd packages/schema && time pnpm build

# 目标: DTS 构建 < 10 秒
```

### 2. 类型安全验证
```typescript
// 类型推导测试
const User = defineEntity('User', {
  id: defineField(z.string(), { primary: true }),
  name: defineField(z.string(), { required: true })
})

// 验证类型推导正常
type UserType = z.infer<typeof User.schema>
```

### 3. 功能完整性测试
```typescript
// 运行时功能测试
const parseResult = User.schema.safeParse(userData)
const fieldMeta = getFieldMeta(User.schema.shape.id)
```

## 🚨 仍需解决的问题

### Auth 包 DTS 构建超时
- **状态**: Schema 包已优化，但 Auth 包仍超时
- **可能原因**: Auth 包中使用了复杂的 UI 类型配置
- **建议方案**: 将 UI 相关类型移至 @linch-kit/ui 包

### 架构设计问题
- **问题**: Schema 包包含大量 UI 配置可能不合理
- **建议**: 考虑模块扩展（module augmentation）方案
- **目标**: 保持包职责单一，避免循环依赖

## 📋 后续优化建议

### 1. 模块扩展方案
```typescript
// @linch-kit/schema 包只包含核心类型
export interface FieldConfig {
  primary?: boolean
  unique?: boolean
  // 只有基础配置
}

// @linch-kit/ui 包通过模块扩展添加 UI 类型
declare module '@linch-kit/schema' {
  interface FieldConfig {
    table?: TableConfig
    form?: FormConfig
    // UI 相关配置
  }
}
```

### 2. 性能监控
```typescript
// 添加构建性能监控
plugins: [
  {
    name: 'build-monitor',
    buildStart() {
      console.time('DTS构建时间')
    },
    buildEnd() {
      console.timeEnd('DTS构建时间')
      // 如果超过10秒发出警告
    }
  }
]
```

### 3. 类型复杂度控制
- 限制泛型嵌套深度不超过 2 层
- 避免循环泛型引用
- 优先使用联合类型而非复杂条件类型
- 复杂类型推导用运行时验证替代

---

**文档版本**: v1.0
**创建时间**: 2025-06-22
**最后更新**: 2025-06-22
**相关文档**: [当前进展](./current-progress.md) | [开发标准](../standards/development-standards.md)
