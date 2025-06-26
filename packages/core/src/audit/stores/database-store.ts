/**
 * 数据库审计存储适配器
 * @module audit/stores/database-store
 */

import type { AuditStore, AuditEvent, AuditFilter } from '../types'

/**
 * Prisma审计存储适配器
 */
export class DatabaseAuditStore implements AuditStore {
  readonly name = 'database'

  constructor(private readonly prisma: any) {} // 使用any避免依赖Prisma类型

  async initialize(): Promise<void> {
    // 确保审计表存在
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM audit_logs LIMIT 1`
    } catch (error) {
      throw new Error(`Audit table 'audit_logs' not found. Please run database migrations.`)
    }
  }

  async store(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return

    const data = events.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      category: event.category,
      severity: event.severity,
      operation: event.operation,
      resource: event.resource,
      resourceId: event.resourceId,
      userId: event.userId,
      userAgent: event.userAgent,
      ipAddress: event.ipAddress,
      sessionId: event.sessionId,
      success: event.success,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      service: event.service,
      requestId: event.requestId,
      traceId: event.traceId,
      retentionPolicy: event.retentionPolicy,
      classification: event.classification
    }))

    await this.prisma.auditLog.createMany({
      data,
      skipDuplicates: true
    })
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    const where: any = {}
    
    if (filter.startDate || filter.endDate) {
      where.timestamp = {}
      if (filter.startDate) {
        where.timestamp.gte = filter.startDate
      }
      if (filter.endDate) {
        where.timestamp.lte = filter.endDate
      }
    }
    
    if (filter.userIds?.length) {
      where.userId = { in: filter.userIds }
    }
    
    if (filter.eventTypes?.length) {
      where.eventType = { in: filter.eventTypes }
    }
    
    if (filter.categories?.length) {
      where.category = { in: filter.categories }
    }
    
    if (filter.severities?.length) {
      where.severity = { in: filter.severities }
    }
    
    if (filter.services?.length) {
      where.service = { in: filter.services }
    }
    
    if (filter.resources?.length) {
      where.resource = { in: filter.resources }
    }
    
    if (filter.success !== undefined) {
      where.success = filter.success
    }
    
    if (filter.search) {
      where.OR = [
        { eventType: { contains: filter.search, mode: 'insensitive' } },
        { resource: { contains: filter.search, mode: 'insensitive' } },
        { errorMessage: { contains: filter.search, mode: 'insensitive' } }
      ]
    }

    const results = await this.prisma.auditLog.findMany({
      where,
      orderBy: {
        [filter.orderBy || 'timestamp']: filter.orderDirection?.toLowerCase() || 'desc'
      },
      skip: filter.offset || 0,
      take: filter.limit || 100
    })

    return results.map(this.transformToAuditEvent)
  }

  async count(filter: AuditFilter): Promise<number> {
    const where: any = {}
    
    if (filter.startDate || filter.endDate) {
      where.timestamp = {}
      if (filter.startDate) {
        where.timestamp.gte = filter.startDate
      }
      if (filter.endDate) {
        where.timestamp.lte = filter.endDate
      }
    }
    
    if (filter.userIds?.length) {
      where.userId = { in: filter.userIds }
    }
    
    if (filter.categories?.length) {
      where.category = { in: filter.categories }
    }
    
    if (filter.services?.length) {
      where.service = { in: filter.services }
    }

    return await this.prisma.auditLog.count({ where })
  }

  async export(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string> {
    const events = await this.query({ ...filter, limit: 10000 }) // 限制导出数量

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2)
      
      case 'csv':
        return this.exportToCsv(events)
      
      case 'xml':
        return this.exportToXml(events)
      
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  async purge(beforeDate: Date): Promise<number> {
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: beforeDate
        }
      }
    })

    return result.count
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  async destroy(): Promise<void> {
    await this.prisma.$disconnect()
  }

  // 私有方法

  private transformToAuditEvent(record: any): AuditEvent {
    return {
      id: record.id,
      timestamp: record.timestamp,
      eventType: record.eventType,
      category: record.category,
      severity: record.severity,
      operation: record.operation,
      resource: record.resource,
      resourceId: record.resourceId,
      userId: record.userId,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
      sessionId: record.sessionId,
      success: record.success,
      errorCode: record.errorCode,
      errorMessage: record.errorMessage,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
      service: record.service,
      requestId: record.requestId,
      traceId: record.traceId,
      retentionPolicy: record.retentionPolicy,
      classification: record.classification
    }
  }

  private exportToCsv(events: AuditEvent[]): string {
    if (events.length === 0) return ''

    const headers = [
      'id', 'timestamp', 'eventType', 'category', 'severity',
      'operation', 'resource', 'resourceId', 'userId', 'userAgent',
      'ipAddress', 'sessionId', 'success', 'errorCode', 'errorMessage',
      'service', 'requestId', 'traceId', 'retentionPolicy', 'classification'
    ]

    const csvRows = [
      headers.join(','),
      ...events.map(event => {
        return headers.map(header => {
          const value = event[header as keyof AuditEvent]
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return String(value)
        }).join(',')
      })
    ]

    return csvRows.join('\n')
  }

  private exportToXml(events: AuditEvent[]): string {
    const xmlEvents = events.map(event => {
      const fields = Object.entries(event)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `    <${key}><![CDATA[${JSON.stringify(value)}]]></${key}>`
          }
          return `    <${key}><![CDATA[${String(value)}]]></${key}>`
        })
        .join('\n')

      return `  <event>\n${fields}\n  </event>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<auditEvents>
${xmlEvents}
</auditEvents>`
  }
}