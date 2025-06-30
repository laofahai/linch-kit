/**
 * 审计系统工厂函数 - 服务端专用
 * @module audit/server-factory
 */

import type { Logger, MetricCollector } from '../types/observability'

import type { AuditManager, AuditPolicy } from './types'
import { DefaultAuditManager } from './audit-manager'
import { FileAuditStore } from './stores/file-store'

/**
 * 创建简单的文件审计管理器（仅服务端）
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
 * 创建完整配置的文件审计管理器（仅服务端）
 */
export function createFileAuditManager(
  logger: Logger,
  metrics: MetricCollector,
  config: {
    filePath: string
    maxFileSize?: number
    rotationPolicy?: 'daily' | 'weekly' | 'monthly' | 'size'
    compression?: boolean
    backupCount?: number
  },
  policy?: Partial<AuditPolicy>
): AuditManager {
  const auditManager = new DefaultAuditManager(logger, metrics, policy)
  
  const fileStore = new FileAuditStore(config)
  auditManager.addStore(fileStore)
  
  return auditManager
}