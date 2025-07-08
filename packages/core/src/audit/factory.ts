/**
 * 审计系统工厂函数
 * @module audit/factory
 */

import type { Logger, MetricCollector } from '../types/observability'

import type { AuditConfig, AuditManager, AuditPolicy } from './types'
import { DefaultAuditManager } from './audit-manager'
import { DatabaseAuditStore } from './stores/database-store'
// 注意：FileAuditStore 相关功能已移至 server.ts

/**
 * 创建审计管理器
 */
export function createAuditManager(
  logger: Logger,
  metrics: MetricCollector,
  config?: AuditConfig
): AuditManager {
  const policy: AuditPolicy = config?.policy || {
    enabled: true,
    categories: ['SECURITY', 'DATA', 'SYSTEM', 'BUSINESS'],
    minSeverity: 'LOW',
    retentionDays: 90,
    realTimeAlerting: false,
    asyncProcessing: true,
    batchSize: 100,
    flushInterval: 5000,
    dataMasking: true,
    compression: false,
  }

  const auditManager = new DefaultAuditManager(logger, metrics, policy)

  // 添加存储适配器
  if (config?.stores?.database?.enabled) {
    // 注意：这里需要外部传入 Prisma 实例
    // auditManager.addStore(new DatabaseAuditStore(prisma))
  }

  if (config?.stores?.file?.enabled && config.stores.file.filePath) {
    // 文件存储配置已找到，但 FileAuditStore 仅在服务端可用
    // 请从 '@linch-kit/core/server' 导入 createFileAuditManager
    throw new Error(
      'File audit store requires server environment. Use createFileAuditManager from @linch-kit/core/server'
    )
  }

  // 添加告警规则
  if (config?.alerting?.enabled && config.alerting.rules) {
    for (const rule of config.alerting.rules) {
      auditManager.addAlertRule(rule)
    }
  }

  return auditManager
}

// 注意：createSimpleFileAuditManager 已移至 @linch-kit/core/server

/**
 * 创建数据库审计管理器
 */
export function createDatabaseAuditManager(
  logger: Logger,
  metrics: MetricCollector,
  prisma: {
    $queryRaw: (query: TemplateStringsArray) => Promise<unknown>
    $disconnect: () => Promise<void>
    audit_logs: {
      create: (data: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>
      createMany: (data: {
        data: Record<string, unknown>[]
        skipDuplicates?: boolean
      }) => Promise<{ count: number }>
      findMany: (query: Record<string, unknown>) => Promise<Record<string, unknown>[]>
      count: (query: Record<string, unknown>) => Promise<number>
      deleteMany: (query: Record<string, unknown>) => Promise<{ count: number }>
    }
  },
  policy?: Partial<AuditPolicy>
): AuditManager {
  const auditManager = new DefaultAuditManager(logger, metrics, policy)

  const dbStore = new DatabaseAuditStore(prisma)
  auditManager.addStore(dbStore)

  return auditManager
}
