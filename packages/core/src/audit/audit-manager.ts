/**
 * 默认审计管理器实现
 * @module audit/audit-manager
 */

import type { Logger, MetricCollector, Counter } from '../types/observability'

import type {
  AuditManager,
  AuditEvent,
  AuditPolicy,
  AuditFilter,
  AuditStore,
  AuditAlert,
  AuditAlertRule,
  DataMasker,
} from './types'
import { DEFAULT_AUDIT_POLICY } from './types'
import { DefaultDataMasker } from './data-masker'

/**
 * 默认审计管理器实现
 */
export class DefaultAuditManager implements AuditManager {
  private eventQueue: AuditEvent[] = []
  private stores = new Map<string, AuditStore>()
  private alertRules = new Map<string, AuditAlertRule>()
  private alerts: AuditAlert[] = []
  private policy: AuditPolicy = { ...DEFAULT_AUDIT_POLICY }
  private flushTimer?: NodeJS.Timeout
  private dataMasker: DataMasker
  private isDestroyed = false
  private counters = new Map<string, Counter>()

  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricCollector,
    initialPolicy?: Partial<AuditPolicy>
  ) {
    this.dataMasker = new DefaultDataMasker()
    if (initialPolicy) {
      this.policy = { ...this.policy, ...initialPolicy }
    }
    this.initializeCounters()
    this.startFlushTimer()
    this.logger.info('Audit manager initialized', { policy: this.policy })
  }

  private initializeCounters(): void {
    this.counters.set(
      'audit_events_queued',
      this.metrics.createCounter({
        name: 'audit_events_queued',
        type: 'counter',
        help: 'Number of audit events queued for processing',
      })
    )
    this.counters.set(
      'audit_events_processed',
      this.metrics.createCounter({
        name: 'audit_events_processed',
        type: 'counter',
        help: 'Number of audit events successfully processed',
      })
    )
    this.counters.set(
      'audit_events_failed',
      this.metrics.createCounter({
        name: 'audit_events_failed',
        type: 'counter',
        help: 'Number of audit events that failed to process',
      })
    )
    this.counters.set(
      'audit_alerts_triggered',
      this.metrics.createCounter({
        name: 'audit_alerts_triggered',
        type: 'counter',
        help: 'Number of audit alerts triggered',
      })
    )
  }

  private getCounter(name: string): Counter {
    const counter = this.counters.get(name)
    if (!counter) {
      throw new Error(`Counter ${name} not found`)
    }
    return counter
  }

  async initialize(): Promise<void> {
    // 初始化所有存储适配器
    const initPromises = Array.from(this.stores.values()).map(async store => {
      try {
        await store.initialize?.()
        this.logger.info(`Audit store ${store.name} initialized`)
      } catch (error) {
        this.logger.error(
          `Failed to initialize audit store ${store.name}`,
          error instanceof Error ? error : new Error(String(error))
        )
        throw error
      }
    })

    await Promise.all(initPromises)
    this.logger.info('All audit stores initialized')
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true

    // 停止刷新定时器
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      delete this.flushTimer
    }

    // 刷新剩余事件
    await this.flush()

    // 销毁所有存储适配器
    const destroyPromises = Array.from(this.stores.values()).map(async store => {
      try {
        await store.destroy?.()
        this.logger.info(`Audit store ${store.name} destroyed`)
      } catch (error) {
        this.logger.error(
          `Failed to destroy audit store ${store.name}`,
          error instanceof Error ? error : new Error(String(error))
        )
      }
    })

    await Promise.allSettled(destroyPromises)
    this.stores.clear()
    this.logger.info('Audit manager destroyed')
  }

  async log(event: Partial<AuditEvent>): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Audit manager has been destroyed')
    }

    const fullEvent = this.enrichEvent(event)

    if (!this.shouldLog(fullEvent)) {
      return
    }

    // 数据脱敏
    if (this.policy.dataMasking && fullEvent.metadata) {
      fullEvent.metadata = this.dataMasker.maskObject(fullEvent.metadata)
    }

    if (this.policy.asyncProcessing) {
      this.eventQueue.push(fullEvent)
      this.getCounter('audit_events_queued').inc()

      // 如果队列过长，强制刷新
      if (this.eventQueue.length >= this.policy.batchSize) {
        await this.flush()
      }
    } else {
      await this.storeEvent(fullEvent)
    }

    // 检查告警规则
    if (this.policy.realTimeAlerting) {
      await this.checkAlertRules(fullEvent)
    }
  }

  logSync(event: Partial<AuditEvent>): void {
    if (this.isDestroyed) {
      throw new Error('Audit manager has been destroyed')
    }

    const fullEvent = this.enrichEvent(event)

    if (!this.shouldLog(fullEvent)) {
      return
    }

    // 数据脱敏
    if (this.policy.dataMasking && fullEvent.metadata) {
      fullEvent.metadata = this.dataMasker.maskObject(fullEvent.metadata)
    }

    this.eventQueue.push(fullEvent)
    this.getCounter('audit_events_queued').inc()
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return
    }

    const eventsToFlush = this.eventQueue.splice(0)
    this.logger.debug(`Flushing ${eventsToFlush.length} audit events`)

    const storePromises = Array.from(this.stores.values()).map(store =>
      this.storeEventsInStore(store, eventsToFlush)
    )

    const results = await Promise.allSettled(storePromises)

    // 处理存储失败的情况
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )

    if (failures.length > 0) {
      this.logger.warn(`${failures.length} audit stores failed during flush`, {
        failures: failures.map(f => f.reason?.message || 'Unknown error'),
      })
    }

    this.getCounter('audit_events_processed').inc(eventsToFlush.length)
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    const stores = Array.from(this.stores.values())
    if (stores.length === 0) {
      this.logger.warn('No audit stores available for query')
      return []
    }

    // 使用第一个可用的存储进行查询
    // TODO: 实现多存储聚合查询
    const primaryStore = stores[0]
    if (!primaryStore) {
      throw new Error('No audit store available for query')
    }

    try {
      const results = await primaryStore.query(filter)
      this.getCounter('audit_events_processed').inc()
      return results
    } catch (error) {
      this.logger.error(
        'Audit query failed',
        error instanceof Error ? error : new Error(String(error)),
        { filter }
      )
      this.getCounter('audit_events_failed').inc()
      throw error
    }
  }

  async count(filter: AuditFilter): Promise<number> {
    const stores = Array.from(this.stores.values())
    if (stores.length === 0) {
      return 0
    }

    const primaryStore = stores[0]
    if (!primaryStore) {
      throw new Error('No audit store available for count')
    }

    try {
      return await primaryStore.count(filter)
    } catch (error) {
      this.logger.error(
        'Audit count failed',
        error instanceof Error ? error : new Error(String(error)),
        { filter }
      )
      throw error
    }
  }

  async export(filter: AuditFilter, format: 'json' | 'csv' | 'xml'): Promise<string> {
    const stores = Array.from(this.stores.values())
    if (stores.length === 0) {
      throw new Error('No audit stores available for export')
    }

    const primaryStore = stores[0]

    try {
      const result = await primaryStore.export(filter, format)
      this.getCounter('audit_events_processed').inc()
      return result
    } catch (error) {
      this.logger.error(
        'Audit export failed',
        error instanceof Error ? error : new Error(String(error)),
        { filter, format }
      )
      this.getCounter('audit_events_failed').inc()
      throw error
    }
  }

  getPolicy(): AuditPolicy {
    return { ...this.policy }
  }

  async updatePolicy(policy: Partial<AuditPolicy>): Promise<void> {
    const oldPolicy = { ...this.policy }
    this.policy = { ...this.policy, ...policy }

    // 如果刷新间隔改变，重启定时器
    if (policy.flushInterval && policy.flushInterval !== oldPolicy.flushInterval) {
      this.restartFlushTimer()
    }

    this.logger.info('Audit policy updated', {
      oldPolicy,
      newPolicy: this.policy,
    })
  }

  addStore(store: AuditStore): void {
    this.stores.set(store.name, store)
    this.logger.info(`Audit store ${store.name} added`)
  }

  removeStore(name: string): void {
    if (this.stores.delete(name)) {
      this.logger.info(`Audit store ${name} removed`)
    }
  }

  getStores(): AuditStore[] {
    return Array.from(this.stores.values())
  }

  addAlertRule(rule: AuditAlertRule): void {
    this.alertRules.set(rule.name, rule)
    this.logger.info(`Audit alert rule ${rule.name} added`)
  }

  removeAlertRule(name: string): void {
    if (this.alertRules.delete(name)) {
      this.logger.info(`Audit alert rule ${name} removed`)
    }
  }

  async getAlerts(filter?: Partial<AuditAlert>): Promise<AuditAlert[]> {
    let alerts = [...this.alerts]

    if (filter) {
      alerts = alerts.filter(alert => {
        if (filter.id && alert.id !== filter.id) return false
        if (filter.ruleName && alert.ruleName !== filter.ruleName) return false
        if (filter.level && alert.level !== filter.level) return false
        if (filter.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged)
          return false
        return true
      })
    }

    return alerts.sort((a, b) => b.alertTime.getTime() - a.alertTime.getTime())
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.logger.info(`Audit alert ${alertId} acknowledged`)
    }
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    const healthPromises = Array.from(this.stores.entries()).map(async ([name, store]) => {
      try {
        const isHealthy = await store.healthCheck()
        health[name] = isHealthy
      } catch (error) {
        health[name] = false
        this.logger.error(
          `Health check failed for audit store ${name}`,
          error instanceof Error ? error : new Error(String(error))
        )
      }
    })

    await Promise.allSettled(healthPromises)
    return health
  }

  // 私有方法

  private enrichEvent(event: Partial<AuditEvent>): AuditEvent {
    const now = new Date()
    const id = event.id || this.generateEventId()

    return {
      id,
      timestamp: event.timestamp || now,
      eventType: event.eventType || 'UNKNOWN',
      category: event.category || 'SYSTEM',
      severity: event.severity || 'LOW',
      operation: event.operation || 'UNKNOWN',
      resource: event.resource || 'unknown',
      service: event.service || 'unknown',
      success: event.success ?? true,
      ...event,
    } as AuditEvent
  }

  private shouldLog(event: AuditEvent): boolean {
    if (!this.policy.enabled) {
      return false
    }

    if (!this.policy.categories.includes(event.category)) {
      return false
    }

    const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const eventLevel = severityLevels.indexOf(event.severity)
    const minLevel = severityLevels.indexOf(this.policy.minSeverity)

    return eventLevel >= minLevel
  }

  private async storeEvent(event: AuditEvent): Promise<void> {
    await this.storeEventsInStores([event])
  }

  private async storeEventsInStores(events: AuditEvent[]): Promise<void> {
    const storePromises = Array.from(this.stores.values()).map(store =>
      this.storeEventsInStore(store, events)
    )

    await Promise.allSettled(storePromises)
  }

  private async storeEventsInStore(store: AuditStore, events: AuditEvent[]): Promise<void> {
    try {
      await store.store(events)
      this.getCounter('audit_events_processed').inc(events.length)
    } catch (error) {
      this.logger.error(
        `Audit store ${store.name} failed`,
        error instanceof Error ? error : new Error(String(error)),
        { eventCount: events.length }
      )
      this.getCounter('audit_events_failed').inc(1)
      throw error
    }
  }

  private async checkAlertRules(event: AuditEvent): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue

      if (this.matchesAlertRule(event, rule)) {
        await this.triggerAlert(rule, event)
      }
    }
  }

  private matchesAlertRule(event: AuditEvent, rule: AuditAlertRule): boolean {
    const filter = rule.filter

    if (filter.categories && !filter.categories.includes(event.category)) return false
    if (filter.severities && !filter.severities.includes(event.severity)) return false
    if (filter.services && !filter.services.includes(event.service)) return false
    if (filter.eventTypes && !filter.eventTypes.includes(event.eventType)) return false
    if (filter.success !== undefined && event.success !== filter.success) return false

    // TODO: 实现更复杂的时间窗口和阈值检查

    return true
  }

  private async triggerAlert(rule: AuditAlertRule, event: AuditEvent): Promise<void> {
    const alert: AuditAlert = {
      id: this.generateAlertId(),
      ruleName: rule.name,
      event,
      alertTime: new Date(),
      level: rule.level,
      message: this.formatAlertMessage(rule.messageTemplate, event),
      acknowledged: false,
    }

    this.alerts.push(alert)
    this.logger.warn(`Audit alert triggered: ${rule.name}`, {
      alertId: alert.id,
      event: event.id,
      level: alert.level,
    })

    this.getCounter('audit_alerts_triggered').inc(1)

    // TODO: 发送通知（邮件、Webhook等）
  }

  private formatAlertMessage(template: string, event: AuditEvent): string {
    return template
      .replace('{{eventType}}', event.eventType)
      .replace('{{resource}}', event.resource)
      .replace('{{userId}}', event.userId || 'unknown')
      .replace('{{service}}', event.service)
      .replace('{{timestamp}}', event.timestamp.toISOString())
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        this.logger.error(
          'Scheduled flush failed',
          error instanceof Error ? error : new Error(String(error))
        )
      })
    }, this.policy.flushInterval)
  }

  private restartFlushTimer(): void {
    this.startFlushTimer()
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
