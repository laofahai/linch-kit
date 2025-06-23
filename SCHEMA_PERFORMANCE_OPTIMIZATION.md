# Schema 包类型推导性能优化策略

## 🎯 优化目标
将 Schema 包的类型推导性能进一步优化，支持更复杂的实体定义而不影响 DTS 构建性能。

## 🔍 当前性能瓶颈分析

### 主要问题
1. **defineField 函数的泛型约束过于复杂**
2. **FieldConfig 接口嵌套层级过深**
3. **类型推导链过长，导致编译器递归深度过大**
4. **大量条件类型映射造成性能损耗**

## 🛠️ 优化策略

### 策略 1：类型推导分层架构

#### 1.1 核心类型层 (Core Layer)
```typescript
// packages/schema/src/core/core-types.ts
export interface MinimalFieldConfig {
  primary?: boolean
  unique?: boolean
  default?: unknown
  map?: string
}

export interface BasicFieldConfig extends MinimalFieldConfig {
  label?: string
  description?: string
  placeholder?: string
  order?: number
  hidden?: boolean
}
```

#### 1.2 扩展类型层 (Extension Layer)
```typescript
// packages/schema/src/core/extended-types.ts
export interface DatabaseFieldConfig {
  type?: DatabaseFieldType
  length?: number
  precision?: number
  scale?: number
}

export interface ValidationFieldConfig {
  required?: boolean
  readonly?: boolean
  errorMessages?: Record<string, string>
}
```

#### 1.3 UI 类型层 (UI Layer)
```typescript
// packages/schema/src/ui/ui-types.ts
export interface UIFieldConfig {
  table?: TableFieldConfig
  form?: FormFieldConfig
  permissions?: PermissionFieldConfig
}
```

### 策略 2：优化 defineField 函数

#### 2.1 简化泛型约束
```typescript
// 优化前：复杂的泛型约束
export function defineField<T extends z.ZodSchema>(
  schema: T,
  config?: ComplexFieldConfig<T>
): EnhancedZodSchema<T>

// 优化后：简化的类型定义
export function defineField<T extends z.ZodSchema>(
  schema: T,
  config?: CoreFieldConfig
): T & { _fieldMeta: FieldMetadata }
```

#### 2.2 运行时元数据附加
```typescript
export function defineField<T extends z.ZodSchema>(
  schema: T,
  config?: CoreFieldConfig
): T {
  // 运行时验证和元数据附加
  if (config && !validateFieldConfig(config)) {
    console.warn('Invalid field config, using defaults')
    config = {}
  }

  // 使用 Symbol 避免类型推导复杂度
  const metadata: FieldMetadata = {
    isPrimary: config?.primary,
    isUnique: config?.unique,
    defaultValue: config?.default,
    _fullConfig: config
  }

  // 直接附加元数据，避免复杂的类型操作
  ;(schema as any)[FIELD_META_SYMBOL] = metadata
  
  return schema
}
```

### 策略 3：模块扩展架构实施

#### 3.1 核心包保持简洁
```typescript
// packages/schema/src/core/field-config.ts
export interface FieldConfig extends BasicFieldConfig {
  db?: DatabaseFieldConfig
  validation?: ValidationFieldConfig
  // UI 相关配置通过模块扩展添加
}
```

#### 3.2 UI 包扩展实现
```typescript
// packages/ui/src/schema/field-config-extensions.ts
declare module '@linch-kit/schema' {
  interface FieldConfig {
    table?: TableFieldConfig
    form?: FormFieldConfig
    permissions?: PermissionFieldConfig
    transform?: TransformFieldConfig
    virtual?: VirtualFieldConfig
  }
}
```

### 策略 4：条件类型优化

#### 4.1 避免深度递归类型
```typescript
// 优化前：深度递归类型映射
type DeepFieldMapping<T> = {
  [K in keyof T]: T[K] extends z.ZodSchema 
    ? EnhancedField<T[K]>
    : T[K] extends Record<string, any>
    ? DeepFieldMapping<T[K]>
    : T[K]
}

// 优化后：简化的类型映射
type SimpleFieldMapping<T> = {
  [K in keyof T]: T[K] extends z.ZodSchema 
    ? T[K] & { _meta?: FieldMetadata }
    : T[K]
}
```

#### 4.2 使用类型断言替代复杂推导
```typescript
// 优化前：复杂的类型推导
export function defineEntity<T extends Record<string, z.ZodSchema>>(
  name: string,
  fields: T
): Entity<InferEntityType<T>>

// 优化后：简化的类型定义
export function defineEntity(
  name: string,
  fields: Record<string, z.ZodSchema>,
  config?: EntityConfig
): Entity {
  // 运行时处理，避免复杂的类型推导
  const schema = z.object(fields)
  return new Entity(name, schema, config)
}
```

## 📊 性能监控机制

### 监控指标
1. **DTS 构建时间**：目标 < 10 秒
2. **类型推导深度**：目标 < 50 层
3. **内存使用量**：目标 < 2GB
4. **编译器警告数量**：目标 = 0

### 监控实现
```typescript
// scripts/performance-monitor.ts
export async function measureDTSBuildTime(packagePath: string): Promise<number> {
  const startTime = Date.now()
  
  try {
    await execAsync('pnpm run build:dts', { cwd: packagePath })
    return Date.now() - startTime
  } catch (error) {
    console.error('DTS build failed:', error)
    return -1
  }
}

export function validatePerformanceThresholds(metrics: PerformanceMetrics): boolean {
  return (
    metrics.dtsBuildTime < 10000 && // 10 秒
    metrics.typeDepth < 50 &&
    metrics.memoryUsage < 2048 // 2GB
  )
}
```

## 🔄 实施计划

### 阶段 1：核心类型重构 (1-2 天)
1. 重构 core-types.ts
2. 简化 defineField 函数
3. 性能基准测试

### 阶段 2：模块扩展实施 (2-3 天)
1. 实现 UI 包扩展
2. 验证类型安全性
3. 更新文档

### 阶段 3：性能优化验证 (1-2 天)
1. 完整性能测试
2. 回归测试
3. 文档更新

## ✅ 成功标准

### 性能目标
- Schema 包 DTS 构建 < 5 秒
- 支持 Auth 包复杂实体定义
- 整体项目构建 < 90 秒

### 功能目标
- 类型安全性 100% 保持
- API 兼容性 100% 保持
- IDE 智能提示完全可用
