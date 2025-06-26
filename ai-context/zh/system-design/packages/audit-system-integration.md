# LinchKit 统一审计系统设计方案

**文档版本**: v1.0.0  
**创建日期**: 2025-06-26  
**维护责任**: 系统架构团队  
**状态**: 🚧 设计阶段

---

## 🎯 问题背景

当前CRUD包中的审计功能仅限于数据库操作审计，但LinchKit作为完整框架需要：

1. **系统级审计**: 跨所有包的统一审计能力
2. **业务审计**: 用户行为、权限变更、配置修改等
3. **技术审计**: API调用、性能指标、错误追踪等
4. **合规审计**: 满足企业级合规要求（SOX、GDPR等）

## 📋 设计决策

### 核心决策：审计系统架构层级

**决策**: 采用 **@linch-kit/core 统一审计基础设施 + 包级专用审计插件** 的分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    @linch-kit/core                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           统一审计基础设施                               │    │
│  │  • AuditManager (审计管理器)                            │    │
│  │  • AuditStore (审计存储适配器)                          │    │
│  │  • AuditEvent (标准审计事件)                            │    │
│  │  • AuditPolicy (审计策略)                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                                   ↑
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────────┐    ┌─────────┐    ┌─────────┐
              │  CRUD   │    │  Auth   │    │  tRPC   │
              │  审计插件  │    │  审计插件  │    │  审计插件  │
              └─────────┘    └─────────┘    └─────────┘
```

### 理由分析

**优势**:
1. **统一标准**: 所有包使用相同的审计事件格式和策略
2. **中央管理**: 统一的审计配置、存储和查询
3. **插件化扩展**: 各包可以添加专用审计逻辑
4. **性能优化**: 统一的批量处理和异步存储
5. **合规支持**: 集中的审计报告和导出功能

**实现策略**:
- @linch-kit/core 提供审计基础设施和通用审计能力
- 各包通过插件扩展专用审计功能
- 保持各包的独立性，审计功能可选开启

---

## 🏗️ 系统架构设计

### 1. @linch-kit/core 审计基础设施

#### 1.1 核心组件

```typescript
// packages/core/src/audit/types.ts
export interface AuditEvent {
  id: string
  timestamp: Date
  eventType: string
  category: 'SECURITY' | 'DATA' | 'SYSTEM' | 'BUSINESS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  // 操作信息
  operation: string
  resource: string
  resourceId?: string
  
  // 用户信息
  userId?: string
  userAgent?: string
  ipAddress?: string
  sessionId?: string
  
  // 结果信息
  success: boolean
  errorCode?: string
  errorMessage?: string
  
  // 详细数据
  metadata?: Record<string, unknown>
  
  // 上下文信息
  service: string
  requestId?: string
  traceId?: string
  
  // 合规字段
  retentionPolicy?: string
  classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
}

export interface AuditPolicy {
  enabled: boolean
  categories: ('SECURITY' | 'DATA' | 'SYSTEM' | 'BUSINESS')[]
  minSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  retentionDays: number
  realTimeAlerting: boolean
  asyncProcessing: boolean
  batchSize: number
  flushInterval: number
}

export interface AuditStore {
  store(events: AuditEvent[]): Promise<void>
  query(filter: AuditFilter): Promise<AuditEvent[]>
  count(filter: AuditFilter): Promise<number>
  export(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string>
  purge(beforeDate: Date): Promise<number>
}

export interface AuditManager {
  log(event: Partial<AuditEvent>): Promise<void>
  logSync(event: Partial<AuditEvent>): void
  flush(): Promise<void>
  query(filter: AuditFilter): Promise<AuditEvent[]>
  getPolicy(): AuditPolicy
  updatePolicy(policy: Partial<AuditPolicy>): Promise<void>
  addStore(name: string, store: AuditStore): void
  removeStore(name: string): void
}
```

#### 1.2 核心实现

```typescript
// packages/core/src/audit/audit-manager.ts
export class DefaultAuditManager implements AuditManager {
  private eventQueue: AuditEvent[] = []
  private stores = new Map<string, AuditStore>()
  private policy: AuditPolicy = DEFAULT_AUDIT_POLICY
  private flushTimer?: NodeJS.Timeout
  
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricCollector
  ) {
    this.startFlushTimer()
  }

  async log(event: Partial<AuditEvent>): Promise<void> {
    const fullEvent = this.enrichEvent(event)
    
    if (!this.shouldLog(fullEvent)) {
      return
    }

    if (this.policy.asyncProcessing) {
      this.eventQueue.push(fullEvent)
      this.metrics.getCounter('audit_events_queued').inc()
    } else {
      await this.storeEvent(fullEvent)
    }
  }

  private enrichEvent(event: Partial<AuditEvent>): AuditEvent {
    return {
      id: event.id || generateId(),
      timestamp: event.timestamp || new Date(),
      service: event.service || 'unknown',
      category: event.category || 'SYSTEM',
      severity: event.severity || 'LOW',
      success: event.success ?? true,
      ...event
    } as AuditEvent
  }

  private shouldLog(event: AuditEvent): boolean {
    if (!this.policy.enabled) return false
    if (!this.policy.categories.includes(event.category)) return false
    
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const eventLevel = severityLevels.indexOf(event.severity)
    const minLevel = severityLevels.indexOf(this.policy.minSeverity)
    
    return eventLevel >= minLevel
  }

  private async storeEvent(event: AuditEvent): Promise<void> {
    const storePromises = Array.from(this.stores.values()).map(store =>
      store.store([event]).catch(error => {
        this.logger.error('Audit store failed', { error: error.message })
        this.metrics.getCounter('audit_store_errors').inc()
      })
    )
    
    await Promise.allSettled(storePromises)
    this.metrics.getCounter('audit_events_stored').inc()
  }
}
```

### 2. 存储适配器设计

#### 2.1 多存储支持

```typescript
// packages/core/src/audit/stores/database-store.ts
export class DatabaseAuditStore implements AuditStore {
  constructor(private readonly prisma: PrismaClient) {}

  async store(events: AuditEvent[]): Promise<void> {
    await this.prisma.auditLog.createMany({
      data: events.map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        eventType: event.eventType,
        category: event.category,
        severity: event.severity,
        operation: event.operation,
        resource: event.resource,
        resourceId: event.resourceId,
        userId: event.userId,
        success: event.success,
        metadata: JSON.stringify(event.metadata),
        service: event.service
      }))
    })
  }
}

// packages/core/src/audit/stores/file-store.ts
export class FileAuditStore implements AuditStore {
  constructor(private readonly filePath: string) {}

  async store(events: AuditEvent[]): Promise<void> {
    const lines = events.map(event => JSON.stringify(event)).join('\n')
    await fs.appendFile(this.filePath, lines + '\n')
  }
}

// packages/core/src/audit/stores/elasticsearch-store.ts
export class ElasticsearchAuditStore implements AuditStore {
  constructor(private readonly client: Client) {}

  async store(events: AuditEvent[]): Promise<void> {
    const body = events.flatMap(event => [
      { index: { _index: `audit-${new Date().toISOString().slice(0, 7)}` } },
      event
    ])

    await this.client.bulk({ body })
  }
}
```

### 3. 包级审计插件集成

#### 3.1 CRUD审计插件重构

```typescript
// packages/crud/src/plugins/audit-integration-plugin.ts
export class CrudAuditIntegrationPlugin extends BaseCrudPlugin {
  constructor(private readonly auditManager: AuditManager) {
    super({
      name: 'crud-audit-integration',
      version: '1.0.0',
      description: 'CRUD操作审计集成插件'
    })
  }

  get hooks(): CrudPluginHooks {
    return {
      afterCreate: async <T>(entityName: string, result: T, context: HookContext): Promise<void> => {
        await this.auditManager.log({
          eventType: 'ENTITY_CREATED',
          category: 'DATA',
          severity: this.getSeverity(entityName),
          operation: 'CREATE',
          resource: entityName,
          resourceId: this.extractId(result),
          userId: this.extractUserId(context.user),
          service: 'crud',
          requestId: context.requestId,
          metadata: {
            entityData: this.sanitizeData(result),
            operation: 'create'
          }
        })
      },

      afterUpdate: async <T>(
        entityName: string,
        result: T,
        existing: unknown,
        changes: FieldChange[],
        context: HookContext
      ): Promise<void> => {
        await this.auditManager.log({
          eventType: 'ENTITY_UPDATED',
          category: 'DATA',
          severity: this.getSeverityForChanges(entityName, changes),
          operation: 'UPDATE',
          resource: entityName,
          resourceId: this.extractId(result),
          userId: this.extractUserId(context.user),
          service: 'crud',
          requestId: context.requestId,
          metadata: {
            changes: this.sanitizeChanges(changes),
            changedFields: changes.map(c => c.fieldName)
          }
        })
      },

      // 敏感字段特殊处理
      beforeSensitiveFieldAccess: async (
        entityName: string,
        fieldName: string,
        value: unknown,
        user: unknown,
        context: HookContext
      ): Promise<unknown> => {
        await this.auditManager.log({
          eventType: 'SENSITIVE_FIELD_ACCESS',
          category: 'SECURITY',
          severity: 'HIGH',
          operation: 'READ',
          resource: `${entityName}.${fieldName}`,
          userId: this.extractUserId(user),
          service: 'crud',
          requestId: context.requestId,
          metadata: {
            entityName,
            fieldName,
            accessType: 'sensitive_field'
          }
        })
        return value
      }
    }
  }

  private getSeverity(entityName: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const sensitiveEntities = ['User', 'Payment', 'Account']
    return sensitiveEntities.includes(entityName) ? 'HIGH' : 'MEDIUM'
  }
}
```

#### 3.2 Auth审计插件

```typescript
// packages/auth/src/plugins/auth-audit-plugin.ts
export class AuthAuditPlugin {
  constructor(private readonly auditManager: AuditManager) {}

  async logLogin(user: User, success: boolean, context: AuthContext): Promise<void> {
    await this.auditManager.log({
      eventType: 'USER_LOGIN',
      category: 'SECURITY',
      severity: success ? 'MEDIUM' : 'HIGH',
      operation: 'LOGIN',
      resource: 'user_session',
      resourceId: user.id,
      userId: user.id,
      success,
      service: 'auth',
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      metadata: {
        loginMethod: context.method,
        failureReason: success ? undefined : context.failureReason
      }
    })
  }

  async logPermissionChange(
    userId: string,
    resource: string,
    oldPermissions: string[],
    newPermissions: string[],
    context: AuthContext
  ): Promise<void> {
    await this.auditManager.log({
      eventType: 'PERMISSION_CHANGED',
      category: 'SECURITY',
      severity: 'CRITICAL',
      operation: 'UPDATE',
      resource: 'user_permissions',
      resourceId: userId,
      userId: context.actorId,
      service: 'auth',
      metadata: {
        targetUserId: userId,
        resource,
        oldPermissions,
        newPermissions,
        addedPermissions: newPermissions.filter(p => !oldPermissions.includes(p)),
        removedPermissions: oldPermissions.filter(p => !newPermissions.includes(p))
      }
    })
  }
}
```

---

## 🔧 使用方式

### 1. 在@linch-kit/core中初始化

```typescript
// packages/core/src/index.ts
export const createLinchKit = async (config: LinchKitConfig) => {
  const auditManager = new DefaultAuditManager(logger, metrics)
  
  // 添加存储适配器
  auditManager.addStore('database', new DatabaseAuditStore(prisma))
  auditManager.addStore('file', new FileAuditStore('/var/log/audit.log'))
  
  // 配置审计策略
  await auditManager.updatePolicy({
    enabled: true,
    categories: ['SECURITY', 'DATA'],
    minSeverity: 'MEDIUM',
    retentionDays: 90,
    realTimeAlerting: true
  })

  return {
    auditManager,
    // ... 其他服务
  }
}
```

### 2. 在CRUD包中集成

```typescript
// packages/crud/src/crud-manager.ts
export const createCrudManager = (
  prisma: PrismaClient,
  schema: LinchKitSchema,
  logger: Logger,
  auditManager?: AuditManager
) => {
  const pluginManager = new HookManager(logger)
  
  // 如果提供了审计管理器，注册审计插件
  if (auditManager) {
    pluginManager.registerPlugin(new CrudAuditIntegrationPlugin(auditManager))
  }

  return new CrudManager(prisma, schema, logger, pluginManager)
}
```

### 3. 统一审计查询

```typescript
// 跨系统审计查询
const auditEvents = await auditManager.query({
  userId: 'user123',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  categories: ['SECURITY'],
  services: ['auth', 'crud']
})

// 导出审计报告
const report = await auditManager.export(
  { startDate: lastMonth, categories: ['SECURITY'] },
  'csv'
)
```

---

## 📊 性能与扩展性

### 1. 性能优化

- **异步处理**: 默认异步批量处理，不阻塞业务操作
- **批量存储**: 批量写入减少I/O开销
- **存储分片**: 按时间分片存储，便于查询和清理
- **缓存优化**: 审计策略缓存，减少配置查询

### 2. 扩展性设计

- **插件化存储**: 支持多种存储后端
- **水平扩展**: 支持分布式审计收集
- **实时流处理**: 集成Kafka等消息队列
- **企业集成**: 支持SIEM系统集成

---

## 🎯 实施计划

### Phase 1: 基础设施（当前）
- [ ] 在@linch-kit/core中实现审计基础设施
- [ ] 重构CRUD审计插件，使用统一审计管理器
- [ ] 数据库存储适配器实现

### Phase 2: 完整集成
- [ ] Auth包审计插件
- [ ] tRPC包审计插件
- [ ] 文件和Elasticsearch存储适配器

### Phase 3: 企业特性
- [ ] 实时告警系统
- [ ] 审计报告生成
- [ ] 合规性检查工具

---

**重要提醒**: 这个设计实现了审计功能与@linch-kit/core的完整集成，提供了统一的审计基础设施，同时保持了各包的独立性和可选性。所有包都可以通过统一的AuditManager进行审计，确保了审计数据的一致性和可追溯性。