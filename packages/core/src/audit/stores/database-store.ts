/**
 * 数据库审计存储适配器
 * @module audit/stores/database-store
 */

import type { AuditStore, AuditEvent, AuditFilter } from '../types'

/**
 * 简化的 Prisma 接口定义
 */
interface SimplePrismaClient {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>
  $disconnect: () => Promise<void>
  audit_logs: {
    create: (data: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>
    createMany: (data: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => Promise<{ count: number }>
    findMany: (query: Record<string, unknown>) => Promise<Record<string, unknown>[]>
    count: (query: Record<string, unknown>) => Promise<number>
    deleteMany: (query: Record<string, unknown>) => Promise<{ count: number }>
  }
}

/**
 * Prisma审计存储适配器
 */
export class DatabaseAuditStore implements AuditStore {
  readonly name = 'database'

  constructor(private readonly prisma: SimplePrismaClient) {}

  async initialize(): Promise<void> {
    // 确保审计表存在
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM audit_logs LIMIT 1`
    } catch {
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

    await this.prisma.audit_logs.createMany({
      data,
      skipDuplicates: true
    })
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    const where: Record<string, unknown> = {}

    if (filter.startDate || filter.endDate) {
      const timestamp: Record<string, unknown> = {}
      if (filter.startDate) {
        timestamp.gte = filter.startDate
      }
      if (filter.endDate) {
        timestamp.lte = filter.endDate
      }
      where.timestamp = timestamp
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

    const results = await this.prisma.audit_logs.findMany({
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
    const where: Record<string, unknown> = {}

    if (filter.startDate || filter.endDate) {
      const timestamp: Record<string, unknown> = {}
      if (filter.startDate) {
        timestamp.gte = filter.startDate
      }
      if (filter.endDate) {
        timestamp.lte = filter.endDate
      }
      where.timestamp = timestamp
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

    return await this.prisma.audit_logs.count({ where })
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
    const result = await this.prisma.audit_logs.deleteMany({
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

  private transformToAuditEvent(record: Record<string, unknown>): AuditEvent {
    return {
      id: record.id as string,
      timestamp: record.timestamp as Date,
      eventType: record.eventType as string,
      category: record.category as "SECURITY" | "DATA" | "SYSTEM" | "BUSINESS",
      severity: record.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      operation: record.operation as string,
      resource: record.resource as string,
      resourceId: record.resourceId as string | undefined,
      userId: record.userId as string | undefined,
      userAgent: record.userAgent as string | undefined,
      ipAddress: record.ipAddress as string | undefined,
      sessionId: record.sessionId as string | undefined,
      success: record.success as boolean,
      errorCode: record.errorCode as string | undefined,
      errorMessage: record.errorMessage as string | undefined,
      metadata: record.metadata ? JSON.parse(record.metadata as string) : undefined,
      service: (record.service as string) || 'unknown',
      requestId: record.requestId as string | undefined,
      traceId: record.traceId as string | undefined,
      retentionPolicy: record.retentionPolicy as string | undefined,
      classification: record.classification as "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | undefined
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