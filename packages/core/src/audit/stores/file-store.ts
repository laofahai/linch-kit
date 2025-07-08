/**
 * 文件审计存储适配器
 * @module audit/stores/file-store
 */

import { promises as fs } from 'fs'
import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { dirname } from 'path'

import type { AuditStore, AuditEvent, AuditFilter } from '../types'

export interface FileStoreConfig {
  filePath: string
  maxFileSize?: number // 字节
  rotationPolicy?: 'daily' | 'weekly' | 'monthly' | 'size'
  compression?: boolean
  backupCount?: number
}

/**
 * 文件审计存储适配器
 */
export class FileAuditStore implements AuditStore {
  readonly name = 'file'

  private readonly maxFileSize: number
  private readonly rotationPolicy: 'daily' | 'weekly' | 'monthly' | 'size'
  private readonly compression: boolean
  private readonly backupCount: number
  private currentFileSize = 0

  constructor(private readonly config: FileStoreConfig) {
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024 // 100MB
    this.rotationPolicy = config.rotationPolicy || 'size'
    this.compression = config.compression || false
    this.backupCount = config.backupCount || 5
  }

  async initialize(): Promise<void> {
    // 确保目录存在
    const dir = dirname(this.config.filePath)
    await fs.mkdir(dir, { recursive: true })

    // 获取当前文件大小
    try {
      const stats = await fs.stat(this.config.filePath)
      this.currentFileSize = stats.size
    } catch {
      this.currentFileSize = 0
    }
  }

  async store(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return

    const lines = events.map(event => JSON.stringify(event)).join('\n') + '\n'
    const dataSize = Buffer.byteLength(lines, 'utf8')

    // 检查是否需要轮转文件
    if (await this.shouldRotateFile(dataSize)) {
      await this.rotateFile()
    }

    // 追加到文件
    await fs.appendFile(this.config.filePath, lines, 'utf8')
    this.currentFileSize += dataSize
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    const events: AuditEvent[] = []
    const files = await this.getAllLogFiles()

    for (const file of files) {
      const fileEvents = await this.readEventsFromFile(file, filter)
      events.push(...fileEvents)
    }

    // 排序和分页
    events.sort((a, b) => {
      const orderBy = filter.orderBy || 'timestamp'
      const direction = filter.orderDirection || 'DESC'

      const aValue = a[orderBy]
      const bValue = b[orderBy]

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (aValue > bValue) comparison = 1
        if (aValue < bValue) comparison = -1
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue > bValue) comparison = 1
        if (aValue < bValue) comparison = -1
      } else if (aValue instanceof Date && bValue instanceof Date) {
        if (aValue > bValue) comparison = 1
        if (aValue < bValue) comparison = -1
      }

      return direction === 'DESC' ? -comparison : comparison
    })

    const offset = filter.offset || 0
    const limit = filter.limit || 100

    return events.slice(offset, offset + limit)
  }

  async count(filter: AuditFilter): Promise<number> {
    let count = 0
    const files = await this.getAllLogFiles()

    for (const file of files) {
      const fileEvents = await this.readEventsFromFile(file, filter)
      count += fileEvents.length
    }

    return count
  }

  async export(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string> {
    const events = await this.query({ ...filter, limit: 10000 })

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
    let deletedCount = 0
    const files = await this.getAllLogFiles()

    for (const file of files) {
      const events = await this.readEventsFromFile(file)
      const eventsToKeep = events.filter(event => event.timestamp >= beforeDate)

      deletedCount += events.length - eventsToKeep.length

      if (eventsToKeep.length === 0) {
        // 删除整个文件
        await fs.unlink(file)
      } else if (eventsToKeep.length < events.length) {
        // 重写文件
        const lines = eventsToKeep.map(event => JSON.stringify(event)).join('\n') + '\n'
        await fs.writeFile(file, lines, 'utf8')
      }
    }

    return deletedCount
  }

  async healthCheck(): Promise<boolean> {
    try {
      const dir = dirname(this.config.filePath)
      await fs.access(dir, fs.constants.W_OK)
      return true
    } catch {
      return false
    }
  }

  // 私有方法

  private async shouldRotateFile(newDataSize: number): Promise<boolean> {
    switch (this.rotationPolicy) {
      case 'size':
        return this.currentFileSize + newDataSize > this.maxFileSize

      case 'daily':
        return await this.shouldRotateByTime('daily')

      case 'weekly':
        return await this.shouldRotateByTime('weekly')

      case 'monthly':
        return await this.shouldRotateByTime('monthly')

      default:
        return false
    }
  }

  private async shouldRotateByTime(policy: 'daily' | 'weekly' | 'monthly'): Promise<boolean> {
    try {
      const stats = await fs.stat(this.config.filePath)
      const fileDate = new Date(stats.mtime)
      const now = new Date()

      switch (policy) {
        case 'daily':
          return (
            fileDate.getDate() !== now.getDate() ||
            fileDate.getMonth() !== now.getMonth() ||
            fileDate.getFullYear() !== now.getFullYear()
          )

        case 'weekly': {
          const weeksDiff = Math.floor(
            (now.getTime() - fileDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          )
          return weeksDiff >= 1
        }

        case 'monthly':
          return (
            fileDate.getMonth() !== now.getMonth() || fileDate.getFullYear() !== now.getFullYear()
          )
      }
    } catch {
      return false
    }
  }

  private async rotateFile(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const rotatedPath = `${this.config.filePath}.${timestamp}`

      // 移动当前文件
      await fs.rename(this.config.filePath, rotatedPath)

      // 压缩文件（如果启用）
      if (this.compression) {
        await this.compressFile(rotatedPath)
        await fs.unlink(rotatedPath)
      }

      // 清理旧备份
      await this.cleanupOldBackups()

      this.currentFileSize = 0
    } catch (error) {
      // 轮转失败时记录错误但不中断操作
      console.error('File rotation failed:', error)
    }
  }

  private async compressFile(filePath: string): Promise<void> {
    const compressedPath = `${filePath}.gz`

    await pipeline(createReadStream(filePath), createGzip(), createWriteStream(compressedPath))
  }

  private async cleanupOldBackups(): Promise<void> {
    const dir = dirname(this.config.filePath)
    const baseName = this.config.filePath.split('/').pop()!

    try {
      const files = await fs.readdir(dir)
      const backupFiles = files
        .filter(file => file.startsWith(baseName) && file !== baseName)
        .map(file => ({
          name: file,
          path: `${dir}/${file}`,
        }))

      const backupStats = await Promise.all(
        backupFiles.map(async file => ({
          ...file,
          stat: await fs.stat(file.path),
        }))
      )

      // 按修改时间排序，保留最新的backupCount个文件
      const sortedBackups = backupStats.sort(
        (a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()
      )

      const filesToDelete = sortedBackups.slice(this.backupCount)

      for (const file of filesToDelete) {
        await fs.unlink(file.path)
      }
    } catch (error) {
      console.error('Backup cleanup failed:', error)
    }
  }

  private async getAllLogFiles(): Promise<string[]> {
    const dir = dirname(this.config.filePath)
    const baseName = this.config.filePath.split('/').pop()!

    try {
      const files = await fs.readdir(dir)
      const logFiles = files
        .filter(file => file === baseName || file.startsWith(`${baseName}.`))
        .map(file => `${dir}/${file}`)
        .sort()

      return logFiles
    } catch {
      return []
    }
  }

  private async readEventsFromFile(filePath: string, filter?: AuditFilter): Promise<AuditEvent[]> {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const lines = content
        .trim()
        .split('\n')
        .filter(line => line.trim())

      const events: AuditEvent[] = []

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as AuditEvent
          if (!filter || this.matchesFilter(event, filter)) {
            events.push(event)
          }
        } catch {
          // 忽略解析错误的行
          continue
        }
      }

      return events
    } catch {
      return []
    }
  }

  private matchesFilter(event: AuditEvent, filter: AuditFilter): boolean {
    if (filter.startDate && event.timestamp < filter.startDate) return false
    if (filter.endDate && event.timestamp > filter.endDate) return false
    if (filter.userIds?.length && (!event.userId || !filter.userIds.includes(event.userId)))
      return false
    if (filter.eventTypes?.length && !filter.eventTypes.includes(event.eventType)) return false
    if (filter.categories?.length && !filter.categories.includes(event.category)) return false
    if (filter.severities?.length && !filter.severities.includes(event.severity)) return false
    if (filter.services?.length && !filter.services.includes(event.service)) return false
    if (filter.resources?.length && !filter.resources.includes(event.resource)) return false
    if (filter.success !== undefined && event.success !== filter.success) return false

    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const searchableText = [
        event.eventType,
        event.resource,
        event.errorMessage,
        JSON.stringify(event.metadata),
      ]
        .join(' ')
        .toLowerCase()

      if (!searchableText.includes(searchLower)) return false
    }

    return true
  }

  private exportToCsv(events: AuditEvent[]): string {
    if (events.length === 0) return ''

    const headers = [
      'id',
      'timestamp',
      'eventType',
      'category',
      'severity',
      'operation',
      'resource',
      'resourceId',
      'userId',
      'userAgent',
      'ipAddress',
      'sessionId',
      'success',
      'errorCode',
      'errorMessage',
      'service',
      'requestId',
      'traceId',
      'retentionPolicy',
      'classification',
    ]

    const csvRows = [
      headers.join(','),
      ...events.map(event => {
        return headers
          .map(header => {
            const value = event[header as keyof AuditEvent]
            if (value === null || value === undefined) return ''
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"') || value.includes('\n'))
            ) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return String(value)
          })
          .join(',')
      }),
    ]

    return csvRows.join('\n')
  }

  private exportToXml(events: AuditEvent[]): string {
    const xmlEvents = events
      .map(event => {
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
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<auditEvents>
${xmlEvents}
</auditEvents>`
  }
}
