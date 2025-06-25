# @linch-kit/schema 依赖关系分析

> **文档类型**: 依赖分析  
> **适用场景**: 理解包间关系和设计决策

## 🎯 依赖关系概览

### 依赖层级图
```mermaid
graph TD
    CORE[@linch-kit/core] --> SCHEMA[@linch-kit/schema]
    SCHEMA --> AUTH[@linch-kit/auth]
    SCHEMA --> CRUD[@linch-kit/crud]
    SCHEMA --> TRPC[@linch-kit/trpc]
    
    ZOD[zod] --> SCHEMA
    TSMORPH[ts-morph] --> SCHEMA
    DEEPDIFF[deep-diff] --> SCHEMA
    I18NEXT[i18next] --> SCHEMA
    
    classDef internal fill:#e1f5fe
    classDef external fill:#f3e5f5
    
    class CORE,SCHEMA,AUTH,CRUD,TRPC internal
    class ZOD,TSMORPH,DEEPDIFF,I18NEXT external
```

## 📦 输入依赖分析

### 来自 @linch-kit/core
```typescript
import { 
  PluginSystem,     // 插件注册和生命周期
  Logger,           // 统一日志接口
  I18nManager,      // 国际化管理
  EventBus,         // 事件通信
  BaseConfig        // 基础配置类型
} from '@linch-kit/core'

// 依赖合理性分析：
// ✅ PluginSystem - Schema插件需要注册到core的插件系统
// ✅ Logger - 代码生成过程需要记录日志
// ✅ I18nManager - Schema国际化需要集成core的i18n系统
// ✅ EventBus - Schema变更需要通知其他包
// ✅ BaseConfig - 配置类型继承
```

### 外部依赖分析
```typescript
// 验证引擎 - Zod
import { z, ZodSchema, ZodType } from 'zod'
/**
 * 选择理由：
 * - 业界标准的TypeScript验证库
 * - 完美的类型推导支持
 * - 丰富的验证规则和组合能力
 * - 与LinchKit的AI-First设计理念契合
 * 
 * 替代方案对比：
 * - Joi: 不支持TypeScript类型推导
 * - Yup: 类型支持不如Zod完善
 * - class-validator: 基于装饰器，不够函数式
 */

// TypeScript代码生成 - ts-morph
import { Project, StructureKind, SourceFile } from 'ts-morph'
/**
 * 选择理由：
 * - 基于TypeScript Compiler API的高级封装
 * - 类型安全的代码生成，避免字符串拼接错误
 * - 支持复杂的代码转换和重构
 * - 活跃维护，与TypeScript版本同步
 * 
 * 替代方案对比：
 * - 手动字符串拼接: 易错、难维护
 * - 原生TS Compiler API: 过于底层复杂
 * - ts-node: 运行时工具，不适合代码生成
 */

// 对象差异检测 - deep-diff
import { diff, Diff } from 'deep-diff'
/**
 * 选择理由：
 * - 成熟的深度对象比较算法
 * - 支持多种差异类型（新增、删除、修改）
 * - 性能优化的实现
 * - 稳定的API，长期维护
 * 
 * 替代方案对比：
 * - lodash.isEqual: 只能判断是否相等，不能得到差异详情
 * - 自建diff算法: 复杂度高，容易有边界情况bug
 */

// 国际化 - i18next
import i18next, { TFunction } from 'i18next'
/**
 * 选择理由：
 * - 国际化领域的事实标准
 * - 支持复杂的插值和复数规则
 * - 丰富的生态和插件
 * - 与@linch-kit/core的i18n系统兼容
 * 
 * 替代方案对比：
 * - react-intl: 只支持React生态
 * - vue-i18n: 只支持Vue生态
 * - 自建i18n: 功能不够完善
 */
```

## 🔄 输出依赖分析

### 被 @linch-kit/auth 包依赖
```typescript
// auth包中使用schema的权限定义
import { 
  PermissionRule,      // 权限规则接口定义
  FieldPermissions,    // 字段级权限配置
  Entity              // 实体定义（用于权限检查）
} from '@linch-kit/schema'

/**
 * 依赖合理性：✅
 * - auth包需要知道哪些字段需要权限控制
 * - 权限规则的接口定义应该在schema包中统一
 * - 不会形成循环依赖（auth不向schema导出权限检查逻辑）
 */

// 设计原则：接口定义在schema，实现在auth
export interface PermissionRule {
  role?: string
  condition?: string  // 条件表达式，由auth包解析执行
  context?: Record<string, unknown>
}

// ❌ 错误示例：schema包不应该依赖auth包的实现
// import { PermissionChecker } from '@linch-kit/auth' // 会造成循环依赖
```

### 被 @linch-kit/crud 包依赖
```typescript
// crud包使用schema的类型定义和验证
import {
  Entity,              // 实体定义
  FieldDefinition,     // 字段定义
  ValidationRule,      // 验证规则
  CreateInput,         // 创建输入类型
  UpdateInput          // 更新输入类型
} from '@linch-kit/schema'

/**
 * 依赖合理性：✅
 * - crud操作需要知道实体结构进行类型安全的操作
 * - 数据验证逻辑应该基于schema定义
 * - 符合"schema驱动"的设计理念
 */

// 实际使用示例
class CrudService<T> {
  constructor(private entity: Entity<T>) {}
  
  async create(data: CreateInput<T>): Promise<T> {
    // 使用schema定义的验证规则
    await this.entity.validate(data)
    // 执行创建逻辑
  }
}
```

### 被 @linch-kit/trpc 包依赖
```typescript
// trpc包使用schema生成API路由和类型
import {
  Entity,              // 实体定义
  CodeGenerator,       // 代码生成器
  ZodSchema           // Zod验证schema
} from '@linch-kit/schema'

/**
 * 依赖合理性：✅
 * - tRPC路由应该基于schema自动生成
 * - API输入输出验证需要使用schema的Zod定义
 * - 保证前后端类型一致性
 */

// API路由自动生成示例
export const generateTRPCRoutes = (entities: Entity[]) => {
  return entities.reduce((router, entity) => {
    router[entity.name.toLowerCase()] = {
      create: procedure
        .input(entity.getCreateInputSchema())  // 使用schema的Zod验证
        .output(entity.getOutputSchema())
        .mutation(({ input }) => {
          // 实现创建逻辑
        }),
      
      findMany: procedure
        .input(entity.getQueryInputSchema())
        .output(z.array(entity.getOutputSchema()))
        .query(({ input }) => {
          // 实现查询逻辑
        })
    }
    return router
  }, {})
}
```

## ⚠️ 循环依赖风险分析

### 潜在风险点

#### 1. 权限系统集成
```typescript
// ❌ 危险：schema包导入auth包会造成循环依赖
// schema -> auth -> schema (循环依赖)

// ✅ 正确设计：接口分离原则
// schema包：定义权限接口
export interface PermissionRule {
  role?: string
  condition?: string
}

// auth包：实现权限检查逻辑
export class PermissionChecker {
  static async checkPermission(
    user: User, 
    rules: PermissionRule[]
  ): Promise<boolean> {
    // 实现权限检查逻辑
  }
}

// schema包：通过插件系统注入权限检查
export class SchemaPermissionPlugin {
  static register() {
    PluginSystem.registerHook('validatePermission', async (context) => {
      // 通过事件系统调用auth包的权限检查，避免直接依赖
      const result = await EventBus.emit('auth:checkPermission', context)
      return result
    })
  }
}
```

#### 2. 数据库集成
```typescript
// ❌ 危险：schema包直接操作数据库
// import { PrismaClient } from '@prisma/client'

// ✅ 正确设计：只生成schema，不执行操作
export class PrismaGenerator {
  static generateSchema(entities: Entity[]): string {
    // 只生成Prisma schema文件内容
    // 不直接操作数据库
  }
}

// 数据库操作由crud包负责
// crud包中：
// import { PrismaClient } from '@prisma/client'
```

#### 3. HTTP路由集成
```typescript
// ❌ 危险：schema包依赖trpc包
// import { router } from '@linch-kit/trpc'

// ✅ 正确设计：生成配置，不直接创建路由
export class APIGenerator {
  static generateRouteConfig(entities: Entity[]): RouteConfig[] {
    // 生成路由配置对象
    // 由trpc包根据配置创建实际路由
  }
}
```

## 🔧 依赖管理最佳实践

### 1. 接口与实现分离
```typescript
// schema包：定义接口
export interface ValidationEngine {
  validate<T>(data: unknown, schema: ZodSchema<T>): Promise<T>
}

// schema包：提供默认实现
export class ZodValidationEngine implements ValidationEngine {
  async validate<T>(data: unknown, schema: ZodSchema<T>): Promise<T> {
    return schema.parseAsync(data)
  }
}

// 其他包可以提供自定义实现
// auth包：
export class AuthAwareValidationEngine implements ValidationEngine {
  async validate<T>(data: unknown, schema: ZodSchema<T>): Promise<T> {
    // 添加权限检查的验证引擎
  }
}
```

### 2. 事件驱动通信
```typescript
// schema包：发布事件，不直接调用其他包
export class SchemaManager {
  async updateSchema(newEntities: Entity[]) {
    const migration = await this.generateMigration(newEntities)
    
    // 通过事件通知其他包，而不是直接调用
    EventBus.emit('schema:updated', {
      entities: newEntities,
      migration
    })
    
    EventBus.emit('schema:migrationGenerated', migration)
  }
}

// 其他包：监听事件做出响应
// crud包中：
EventBus.on('schema:updated', ({ entities }) => {
  // 更新CRUD服务的实体定义
})

// auth包中：
EventBus.on('schema:updated', ({ entities }) => {
  // 更新权限规则缓存
})
```

### 3. 配置驱动扩展
```typescript
// schema包：提供配置接口
export interface SchemaConfig {
  generators: GeneratorConfig[]
  validators: ValidatorConfig[]
  plugins: PluginConfig[]
}

// 其他包：通过配置扩展功能
// auth包提供权限生成器配置：
export const authGeneratorConfig: GeneratorConfig = {
  name: 'permission-checker',
  generate: (entities: Entity[]) => {
    // 生成权限检查代码
  }
}

// schema包：加载配置
export class SchemaSystem {
  static configure(config: SchemaConfig) {
    config.generators.forEach(gen => this.registerGenerator(gen))
    config.validators.forEach(val => this.registerValidator(val))
    config.plugins.forEach(plugin => this.loadPlugin(plugin))
  }
}
```

## 📊 依赖影响分析

### 构建时依赖
| 依赖包 | 构建时间影响 | 包大小影响 | 风险等级 |
|--------|-------------|-----------|---------|
| zod | +200ms | +45KB | 低 |
| ts-morph | +500ms | +2.1MB | 中 |
| deep-diff | +50ms | +15KB | 低 |
| i18next | +100ms | +85KB | 低 |

### 运行时依赖
| 功能 | 内存使用 | 启动时间 | 热路径影响 |
|------|---------|---------|-----------|
| Schema验证 | ~5MB | +50ms | 中等 |
| 代码生成 | ~15MB | +200ms | 低（开发时） |
| 差异检测 | ~2MB | +10ms | 低 |
| 国际化 | ~3MB | +30ms | 低 |

### 依赖风险评估
- **版本兼容性**: 中等风险（需要跟踪TypeScript版本更新）
- **安全性**: 低风险（所选库都有活跃维护）
- **性能影响**: 低风险（主要在开发时使用）
- **维护成本**: 低风险（减少了75%的自建代码）

---

**总结**: @linch-kit/schema 包通过合理的依赖设计，既利用了成熟第三方库的优势，又避免了循环依赖等架构风险。关键是坚持"接口定义在schema，实现在具体包"的原则，使用事件驱动而非直接调用的通信方式。