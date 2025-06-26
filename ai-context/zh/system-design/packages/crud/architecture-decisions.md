# @linch-kit/crud 架构决策记录

**文档版本**: v1.0.0
**创建日期**: 2025-06-26
**维护责任**: CRUD包开发团队
**状态**: ✅ 已确定

---

## 🎯 核心架构决策

### 决策1: 平衡封装与原生访问

**问题**: CRUD包的封装程度 - 是否应该完全封装Prisma，还是保留原生访问？

**决策**: 采用**分层访问策略**

**理由**:
1. **便利性需求**: 开发者需要简化的CRUD操作API
2. **灵活性需求**: 复杂查询场景需要Prisma原生能力
3. **渐进式学习**: 从简单API开始，需要时深入原生API

**实现方案**:
```typescript
// 层次1: 便捷API
await crud.findMany('User', { where: [{ field: 'status', operator: '=', value: 'active' }] })

// 层次2: 直接模型访问
await crud.model('User').findMany({ where: { status: 'active' } })

// 层次3: 原生Prisma客户端
await crud.client.user.findMany({ where: { status: 'active' } })
```

---

### 决策2: 查询构建器重构

**问题**: 原始QueryBuilder类过大，违反单一职责原则

**决策**: 采用**模块化设计模式组合**

**应用的设计模式**:
- **策略模式**: 不同查询操作符使用不同策略
- **建造者模式**: 链式API构建查询
- **命令模式**: 封装查询执行逻辑
- **工厂模式**: 创建查询构建器实例

**模块划分**:
```
query-builder/
├── base-query-builder.ts     # 抽象基类
├── condition-builder.ts      # 条件构建（策略模式）
├── query-executor.ts         # 查询执行（命令模式）
├── query-optimizer.ts        # 查询优化
├── query-validator.ts        # 查询验证
└── prisma-query-builder.ts   # Prisma具体实现
```

---

### 决策3: 插件系统设计

**问题**: 如何支持CRUD功能扩展而不破坏核心架构？

**决策**: 采用**钩子插件系统**

**插件钩子设计**:
```typescript
interface CrudPluginHooks {
  // 操作生命周期钩子
  beforeCreate?<T>(entityName: string, data: CreateInput<T>, options?: CrudOptions): Promise<CreateInput<T>>
  afterCreate?<T>(entityName: string, result: T, options?: CrudOptions): Promise<void>
  
  // 查询钩子
  beforeQuery?(entityName: string, query: Record<string, unknown>, options?: FindOptions): Promise<Record<string, unknown>>
  
  // 验证钩子
  beforeValidation?(entityName: string, data: unknown, operation: 'create' | 'update'): Promise<unknown>
  
  // 缓存钩子
  beforeCacheGet?(key: string, entityName: string): Promise<string>
}
```

**插件注册机制**:
```typescript
// 基础插件类
export abstract class BaseCrudPlugin implements CrudPlugin {
  abstract get hooks(): CrudPluginHooks
  async initialize(): Promise<void> { /* ... */ }
}

// 使用插件
const crud = createCrudManager(prisma, schema, logger, {
  pluginManager: new PluginManager([
    new AuditLogPlugin(),
    new CachePlugin(),
    new MetricsPlugin()
  ])
})
```

---

### 决策4: 可选增强功能

**问题**: 权限、验证、缓存等功能是否应该强制启用？

**决策**: 采用**可配置的功能开关**

**配置方案**:
```typescript
interface CrudManagerOptions {
  enablePermissions?: boolean  // 默认: true
  enableValidation?: boolean   // 默认: true  
  enableCache?: boolean        // 默认: true
  enableAudit?: boolean        // 默认: true
  enableMetrics?: boolean      // 默认: true
}

// 最小化配置（仅基础功能）
const minimalCrud = createMinimalCrudManager(prisma, schema, logger)

// 完整配置
const fullCrud = createDefaultCrudManager(prisma, schema, logger, pluginManager)
```

**好处**:
1. **性能优化**: 不需要的功能不会影响性能
2. **渐进式采用**: 从简单开始，逐步启用功能
3. **测试友好**: 测试时可以禁用复杂功能

---

### 决策5: 事务和批量操作

**问题**: 如何处理复杂的事务和批量操作？

**决策**: **直接暴露Prisma原生能力**

**实现方案**:
```typescript
// 事务支持 - 直接暴露Prisma事务
async transaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  options?: { timeout?: number; isolationLevel?: string }
): Promise<T> {
  return await this.prisma.$transaction(callback, options)
}

// 批量操作 - 使用Prisma原生批量API
async createMany<T>(
  entityName: string,
  data: CreateInput<T>[],
  options?: { skipDuplicates?: boolean }
): Promise<{ count: number }> {
  const model = this.model(entityName)
  return await model.createMany({ data, skipDuplicates: options?.skipDuplicates })
}
```

**原因**:
1. **性能最优**: Prisma的批量操作已经高度优化
2. **功能完整**: 不需要重新实现复杂的事务逻辑
3. **维护简单**: 减少自定义代码的维护负担

---

### 决策6: 错误处理策略

**问题**: 如何处理验证错误、权限错误、数据库错误？

**决策**: 采用**分层错误处理**

**错误类型设计**:
```typescript
// 验证错误
export class ValidationException extends Error {
  constructor(message: string, public readonly errors: ValidationError[]) {
    super(message)
    this.name = 'ValidationException'
  }
}

// 权限错误
export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly resource?: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}
```

**错误处理流程**:
1. **验证阶段**: 抛出 ValidationException
2. **权限阶段**: 抛出 PermissionError  
3. **数据库阶段**: 透传 Prisma 错误
4. **插件阶段**: 插件自定义错误

---

## 📊 性能考虑

### 查询优化策略

1. **自动include优化**: 根据Schema自动包含必要关联
2. **缓存策略**: 可配置的多级缓存
3. **批量操作**: 直接使用Prisma批量API
4. **连接池**: 依赖Prisma的连接池管理

### 内存管理

1. **查询构建器**: 使用对象池减少GC压力
2. **结果缓存**: LRU缓存策略
3. **插件生命周期**: 及时清理插件资源

---

## 🔄 与其他包的集成

### @linch-kit/auth 集成
- **权限检查**: 实体级、字段级、行级权限
- **用户上下文**: 自动传递用户信息到审计日志

### @linch-kit/schema 集成  
- **Schema驱动**: 根据Schema定义验证和权限
- **类型安全**: 利用Schema生成的TypeScript类型

### @linch-kit/core 集成
- **插件系统**: 使用core的PluginManager
- **日志系统**: 集成core的Logger
- **配置管理**: 使用core的ConfigManager

---

## 🚀 未来扩展计划

### Phase 2 功能
1. **查询缓存**: 智能查询结果缓存
2. **读写分离**: 支持读写分离的数据库架构
3. **分片支持**: 多租户数据分片

### Phase 3 功能  
1. **图查询**: 支持GraphQL风格的关联查询
2. **时间旅行**: 数据版本控制和历史查询
3. **AI优化**: 基于使用模式的自动查询优化

---

**重要提醒**: 这些架构决策确保了CRUD包既提供便利的高层API，又保持了Prisma原生功能的完整访问能力，支持从简单到复杂的各种使用场景。