/**
 * 统一审计系统类型定义
 * @module audit/types
 */

/**
 * 审计事件标准接口
 */
export interface AuditEvent {
  /** 唯一标识符 */
  id: string
  /** 事件时间戳 */
  timestamp: Date
  /** 事件类型 */
  eventType: string
  /** 事件分类 */
  category: 'SECURITY' | 'DATA' | 'SYSTEM' | 'BUSINESS'
  /** 严重程度 */
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  // 操作信息
  /** 操作名称 */
  operation: string
  /** 资源名称 */
  resource: string
  /** 资源ID */
  resourceId?: string

  // 用户信息
  /** 用户ID */
  userId?: string
  /** 用户代理 */
  userAgent?: string
  /** IP地址 */
  ipAddress?: string
  /** 会话ID */
  sessionId?: string

  // 结果信息
  /** 操作是否成功 */
  success: boolean
  /** 错误代码 */
  errorCode?: string
  /** 错误消息 */
  errorMessage?: string

  // 详细数据
  /** 元数据 */
  metadata?: Record<string, unknown>

  // 上下文信息
  /** 服务名称 */
  service: string
  /** 请求ID */
  requestId?: string
  /** 追踪ID */
  traceId?: string

  // 合规字段
  /** 保留策略 */
  retentionPolicy?: string
  /** 分类等级 */
  classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
}

/**
 * 审计策略配置
 */
export interface AuditPolicy {
  /** 是否启用审计 */
  enabled: boolean
  /** 启用的审计分类 */
  categories: ('SECURITY' | 'DATA' | 'SYSTEM' | 'BUSINESS')[]
  /** 最小严重程度 */
  minSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  /** 保留天数 */
  retentionDays: number
  /** 实时告警 */
  realTimeAlerting: boolean
  /** 异步处理 */
  asyncProcessing: boolean
  /** 批处理大小 */
  batchSize: number
  /** 刷新间隔（毫秒） */
  flushInterval: number
  /** 敏感数据脱敏 */
  dataMasking: boolean
  /** 压缩存储 */
  compression: boolean
}

/**
 * 审计查询过滤器
 */
export interface AuditFilter {
  /** 开始时间 */
  startDate?: Date
  /** 结束时间 */
  endDate?: Date
  /** 用户ID列表 */
  userIds?: string[]
  /** 事件类型列表 */
  eventTypes?: string[]
  /** 分类列表 */
  categories?: ('SECURITY' | 'DATA' | 'SYSTEM' | 'BUSINESS')[]
  /** 严重程度列表 */
  severities?: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[]
  /** 服务列表 */
  services?: string[]
  /** 资源列表 */
  resources?: string[]
  /** 是否成功 */
  success?: boolean
  /** 文本搜索 */
  search?: string
  /** 分页偏移 */
  offset?: number
  /** 分页限制 */
  limit?: number
  /** 排序字段 */
  orderBy?: keyof AuditEvent
  /** 排序方向 */
  orderDirection?: 'ASC' | 'DESC'
}

/**
 * 审计存储接口
 */
export interface AuditStore {
  /** 存储名称 */
  name: string

  /** 存储审计事件 */
  store(events: AuditEvent[]): Promise<void>

  /** 查询审计事件 */
  query(filter: AuditFilter): Promise<AuditEvent[]>

  /** 统计审计事件数量 */
  count(filter: AuditFilter): Promise<number>

  /** 导出审计数据 */
  export(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string>

  /** 清理过期数据 */
  purge(beforeDate: Date): Promise<number>

  /** 健康检查 */
  healthCheck(): Promise<boolean>

  /** 初始化存储 */
  initialize?(): Promise<void>

  /** 销毁存储 */
  destroy?(): Promise<void>
}

/**
 * 审计告警接口
 */
export interface AuditAlert {
  /** 告警ID */
  id: string
  /** 告警规则名称 */
  ruleName: string
  /** 触发的审计事件 */
  event: AuditEvent
  /** 告警时间 */
  alertTime: Date
  /** 告警级别 */
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  /** 告警消息 */
  message: string
  /** 是否已处理 */
  acknowledged: boolean
}

/**
 * 审计告警规则
 */
export interface AuditAlertRule {
  /** 规则名称 */
  name: string
  /** 规则描述 */
  description?: string
  /** 是否启用 */
  enabled: boolean
  /** 过滤条件 */
  filter: AuditFilter
  /** 告警级别 */
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  /** 告警消息模板 */
  messageTemplate: string
  /** 时间窗口（秒） */
  timeWindow?: number
  /** 阈值 */
  threshold?: number
  /** 抑制时间（秒） */
  suppressionTime?: number
}

/**
 * 审计管理器接口
 */
export interface AuditManager {
  /** 记录审计事件（异步） */
  log(event: Partial<AuditEvent>): Promise<void>

  /** 记录审计事件（同步） */
  logSync(event: Partial<AuditEvent>): void

  /** 强制刷新缓存的事件 */
  flush(): Promise<void>

  /** 查询审计事件 */
  query(filter: AuditFilter): Promise<AuditEvent[]>

  /** 统计审计事件 */
  count(filter: AuditFilter): Promise<number>

  /** 导出审计数据 */
  export(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string>

  /** 获取当前审计策略 */
  getPolicy(): AuditPolicy

  /** 更新审计策略 */
  updatePolicy(policy: Partial<AuditPolicy>): Promise<void>

  /** 添加存储适配器 */
  addStore(store: AuditStore): void

  /** 移除存储适配器 */
  removeStore(name: string): void

  /** 获取所有存储适配器 */
  getStores(): AuditStore[]

  /** 添加告警规则 */
  addAlertRule(rule: AuditAlertRule): void

  /** 移除告警规则 */
  removeAlertRule(name: string): void

  /** 获取告警历史 */
  getAlerts(filter?: Partial<AuditAlert>): Promise<AuditAlert[]>

  /** 确认告警 */
  acknowledgeAlert(alertId: string): Promise<void>

  /** 健康检查 */
  healthCheck(): Promise<Record<string, boolean>>

  /** 初始化 */
  initialize(): Promise<void>

  /** 销毁 */
  destroy(): Promise<void>
}

/**
 * 审计配置
 */
export interface AuditConfig {
  /** 审计策略 */
  policy: AuditPolicy
  /** 存储配置 */
  stores: {
    /** 数据库存储 */
    database?: {
      enabled: boolean
      tableName?: string
    }
    /** 文件存储 */
    file?: {
      enabled: boolean
      filePath: string
      maxFileSize?: number
      rotationPolicy?: 'daily' | 'weekly' | 'monthly' | 'size'
    }
    /** Elasticsearch存储 */
    elasticsearch?: {
      enabled: boolean
      endpoint: string
      indexPrefix?: string
      username?: string
      password?: string
    }
  }
  /** 告警配置 */
  alerting?: {
    enabled: boolean
    rules: AuditAlertRule[]
    notifications?: {
      email?: {
        enabled: boolean
        smtp: {
          host: string
          port: number
          username: string
          password: string
        }
        recipients: string[]
      }
      webhook?: {
        enabled: boolean
        url: string
        headers?: Record<string, string>
      }
    }
  }
}

/**
 * 数据脱敏器接口
 */
export interface DataMasker {
  /** 脱敏单个值 */
  maskValue(value: unknown, fieldName: string): unknown

  /** 脱敏对象 */
  maskObject(obj: Record<string, unknown>): Record<string, unknown>

  /** 脱敏数组 */
  maskArray(arr: unknown[]): unknown[]

  /** 检查字段是否敏感 */
  isSensitiveField(fieldName: string): boolean

  /** 添加敏感字段模式 */
  addSensitivePattern(pattern: string | RegExp): void
}

/**
 * 默认审计策略
 */
export const DEFAULT_AUDIT_POLICY: AuditPolicy = {
  enabled: true,
  categories: ['SECURITY', 'DATA', 'SYSTEM', 'BUSINESS'],
  minSeverity: 'LOW',
  retentionDays: 90,
  realTimeAlerting: false,
  asyncProcessing: true,
  batchSize: 100,
  flushInterval: 5000, // 5秒
  dataMasking: true,
  compression: false,
}
