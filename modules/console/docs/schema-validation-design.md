# Schema 验证器设计方案

## 问题描述

Console 模块中定义了 Schema 实体，但需要在运行时使用验证器，而验证器通常由 CLI 在 Starter 中生成。需要一个解决方案来桥接这个gap。

## 解决方案

### 方案 1：运行时验证器生成 ✅ (推荐)

**核心思路**：Schema 包提供运行时验证器生成功能，模块可以直接从实体定义生成验证器。

```typescript
// @linch-kit/schema 包中
export function createValidatorsFromEntity<T>(entity: EntityDefinition<T>) {
  return {
    // 基础验证器
    schema: entity.zodSchema,
    create: entity.createSchema,
    update: entity.updateSchema,

    // 验证函数
    validate: (data: unknown) => entity.zodSchema.safeParse(data),
    validateCreate: (data: unknown) => entity.createSchema.safeParse(data),
    validateUpdate: (data: unknown) => entity.updateSchema.safeParse(data),

    // 类型断言
    assert: (data: unknown): T => entity.zodSchema.parse(data),
    assertCreate: (data: unknown) => entity.createSchema.parse(data),
    assertUpdate: (data: unknown) => entity.updateSchema.parse(data),
  }
}
```

**使用方式**：

```typescript
// 在 Console 模块中
import { createValidatorsFromEntity } from '@linch-kit/schema'
import { TenantEntity } from './entities'

export const tenantValidators = createValidatorsFromEntity(TenantEntity)

// 立即可用
const result = tenantValidators.validateCreate(inputData)
if (result.success) {
  // 使用 result.data
}
```

**优点**：

- ✅ 运行时立即可用
- ✅ 与实体定义同步
- ✅ 类型安全
- ✅ 无需 CLI 依赖

**缺点**：

- ❌ 可能有少量运行时开销

### 方案 2：混合生成策略

**核心思路**：运行时 + 构建时双重生成，提供最佳性能和开发体验。

```typescript
// 运行时快速验证器（开发时使用）
export const runtimeValidators = createValidatorsFromEntity(TenantEntity)

// 构建时生成的优化验证器（生产时使用）
export const buildTimeValidators =
  typeof window !== 'undefined' ? runtimeValidators : await import('./generated/tenant-validators')
```

### 方案 3：验证器注册系统

**核心思路**：创建一个全局验证器注册表，CLI 生成时更新，运行时降级到实体定义。

```typescript
// @linch-kit/schema
class ValidatorRegistry {
  private validators = new Map()

  register(entityName: string, validators: any) {
    this.validators.set(entityName, validators)
  }

  get(entityName: string, entity?: EntityDefinition) {
    // 优先使用注册的验证器（CLI 生成）
    if (this.validators.has(entityName)) {
      return this.validators.get(entityName)
    }

    // 降级到运行时生成
    if (entity) {
      return createValidatorsFromEntity(entity)
    }

    throw new Error(`Validator not found for entity: ${entityName}`)
  }
}

export const validatorRegistry = new ValidatorRegistry()
```

## 推荐实现

### 1. Schema 包增强

```typescript
// packages/schema/src/validators.ts
export interface EntityValidators<T> {
  // Zod schemas
  schema: z.ZodSchema<T>
  createSchema: z.ZodSchema<CreateInput<T>>
  updateSchema: z.ZodSchema<UpdateInput<T>>

  // Validation functions
  validate: (data: unknown) => SafeParseResult<T>
  validateCreate: (data: unknown) => SafeParseResult<CreateInput<T>>
  validateUpdate: (data: unknown) => SafeParseResult<UpdateInput<T>>

  // Type assertions
  assert: (data: unknown) => T
  assertCreate: (data: unknown) => CreateInput<T>
  assertUpdate: (data: unknown) => UpdateInput<T>

  // Conditional validation
  validateIf: (condition: boolean, data: unknown) => SafeParseResult<T>
  validatePartial: (data: unknown) => SafeParseResult<Partial<T>>
}

export function createValidatorsFromEntity<T>(entity: EntityDefinition<T>): EntityValidators<T> {
  return {
    schema: entity.zodSchema,
    createSchema: entity.createSchema,
    updateSchema: entity.updateSchema,

    validate: data => entity.zodSchema.safeParse(data),
    validateCreate: data => entity.createSchema.safeParse(data),
    validateUpdate: data => entity.updateSchema.safeParse(data),

    assert: data => entity.zodSchema.parse(data),
    assertCreate: data => entity.createSchema.parse(data),
    assertUpdate: data => entity.updateSchema.parse(data),

    validateIf: (condition, data) =>
      condition ? entity.zodSchema.safeParse(data) : { success: true, data: data as T },

    validatePartial: data => entity.updateSchema.safeParse(data),
  }
}
```

### 2. Console 模块使用

```typescript
// modules/console/src/validation/index.ts
import { createValidatorsFromEntity } from '@linch-kit/schema'
import { TenantEntity, PluginEntity } from '../entities'

// 立即生成验证器
export const tenantValidators = createValidatorsFromEntity(TenantEntity)
export const pluginValidators = createValidatorsFromEntity(PluginEntity)

// 便捷验证函数
export function validateTenantData(data: unknown) {
  const result = tenantValidators.validate(data)
  if (!result.success) {
    throw new ValidationError('Invalid tenant data', result.error)
  }
  return result.data
}
```

### 3. 服务层集成

```typescript
// modules/console/src/services/tenant.service.ts
import { tenantValidators } from '../validation'

export class TenantService {
  async createTenant(input: unknown) {
    // 运行时验证
    const validatedInput = tenantValidators.assertCreate(input)

    // 继续业务逻辑
    return this.crudService.create(validatedInput, context)
  }
}
```

### 4. CLI 优化生成

```typescript
// CLI 在 starter 中生成优化版本
// apps/starter/src/generated/validators/tenant.ts
export const optimizedTenantValidators = {
  // 预编译的验证器，性能更好
  validate: (data: unknown) => {
    /* 优化后的验证逻辑 */
  },
  // ...
}

// 在生产环境使用优化版本
export const tenantValidators =
  process.env.NODE_ENV === 'production' ? optimizedTenantValidators : runtimeTenantValidators
```

## 总结

**推荐方案 1（运行时验证器生成）**，因为：

1. **简单直接**：无需复杂的生成和注册机制
2. **开发友好**：实体定义改变时验证器自动同步
3. **类型安全**：完整的 TypeScript 支持
4. **性能可接受**：验证器生成一次，多次使用
5. **向后兼容**：可以在未来添加 CLI 优化

这种方案让 Console 模块可以立即使用验证器，而不需要等待 CLI 生成，同时保持了架构的灵活性。
