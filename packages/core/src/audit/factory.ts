/**
 * 审计系统工厂函数
 * @module audit/factory
 */

import type { Logger, MetricCollector } from '../types/observability'
import type { AuditConfig, AuditManager, AuditPolicy } from './types'
import { DefaultAuditManager } from './audit-manager'
import { DatabaseAuditStore } from './stores/database-store'
import { FileAuditStore } from './stores/file-store'

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
    compression: false
  }

  const auditManager = new DefaultAuditManager(logger, metrics, policy)

  // 添加存储适配器
  if (config?.stores?.database?.enabled) {
    // 注意：这里需要外部传入 Prisma 实例
    // auditManager.addStore(new DatabaseAuditStore(prisma))
  }

  if (config?.stores?.file?.enabled && config.stores.file.filePath) {
    const fileStore = new FileAuditStore({
      filePath: config.stores.file.filePath,
      maxFileSize: config.stores.file.maxFileSize,
      rotationPolicy: config.stores.file.rotationPolicy
    })
    auditManager.addStore(fileStore)
  }

  // 添加告警规则
  if (config?.alerting?.enabled && config.alerting.rules) {
    for (const rule of config.alerting.rules) {
      auditManager.addAlertRule(rule)
    }
  }

  return auditManager
}

/**
 * 创建简单的文件审计管理器
 */
export function createSimpleFileAuditManager(
  logger: Logger,
  metrics: MetricCollector,
  filePath: string,
  policy?: Partial<AuditPolicy>
): AuditManager {
  const auditManager = new DefaultAuditManager(logger, metrics, policy)
  
  const fileStore = new FileAuditStore({
    filePath,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    rotationPolicy: 'daily',
    compression: true,
    backupCount: 7
  })
  
  auditManager.addStore(fileStore)
  return auditManager
}

/**
 * 创建数据库审计管理器
 */
export function createDatabaseAuditManager(
  logger: Logger,
  metrics: MetricCollector,
  prisma: any,
  policy?: Partial<AuditPolicy>
): AuditManager {
  const auditManager = new DefaultAuditManager(logger, metrics, policy)
  
  const dbStore = new DatabaseAuditStore(prisma)
  auditManager.addStore(dbStore)
  
  return auditManager
}