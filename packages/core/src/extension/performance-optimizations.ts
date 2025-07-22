/**
 * Extension系统性能优化
 * @module extension/performance-optimizations
 */

/**
 * Extension加载缓存管理器
 * 优化Extension的重复加载性能
 */
export class ExtensionLoadCache {
  private static instance: ExtensionLoadCache
  private cache = new Map<string, {
    extension: unknown
    manifest: unknown
    loadedAt: number
    hits: number
  }>()
  
  private constructor() {}
  
  static getInstance(): ExtensionLoadCache {
    if (!ExtensionLoadCache.instance) {
      ExtensionLoadCache.instance = new ExtensionLoadCache()
    }
    return ExtensionLoadCache.instance
  }
  
  /**
   * 获取缓存的Extension
   */
  get(extensionId: string) {
    const cached = this.cache.get(extensionId)
    if (cached) {
      cached.hits++
      return cached
    }
    return null
  }
  
  /**
   * 设置Extension缓存
   */
  set(extensionId: string, extension: unknown, manifest: unknown) {
    this.cache.set(extensionId, {
      extension,
      manifest,
      loadedAt: Date.now(),
      hits: 0,
    })
  }
  
  /**
   * 清理过期缓存
   */
  cleanup(maxAge = 1000 * 60 * 30) { // 30分钟
    const now = Date.now()
    for (const [id, cached] of this.cache.entries()) {
      if (now - cached.loadedAt > maxAge) {
        this.cache.delete(id)
      }
    }
  }
  
  /**
   * 获取缓存统计
   */
  getStats() {
    const stats = {
      totalExtensions: this.cache.size,
      totalHits: 0,
      extensions: [] as Array<{
        id: string
        hits: number
        loadedAt: number
      }>
    }
    
    for (const [id, cached] of this.cache.entries()) {
      stats.totalHits += cached.hits
      stats.extensions.push({
        id,
        hits: cached.hits,
        loadedAt: cached.loadedAt,
      })
    }
    
    return stats
  }
}

/**
 * Extension通信优化器
 * 批量处理Extension间的通信以提高性能
 */
export class ExtensionCommunicationOptimizer {
  private messageQueue: Array<{
    from: string
    to: string
    message: unknown
    timestamp: number
  }> = []
  
  private batchTimer: NodeJS.Timeout | null = null
  private readonly batchDelay = 10 // 10ms批量延迟
  
  /**
   * 添加消息到队列
   */
  queueMessage(from: string, to: string, message: unknown) {
    this.messageQueue.push({
      from,
      to,
      message,
      timestamp: Date.now(),
    })
    
    // 设置批量处理定时器
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
        this.batchTimer = null
      }, this.batchDelay)
    }
  }
  
  /**
   * 批量处理消息
   */
  private processBatch() {
    if (this.messageQueue.length === 0) return
    
    // 按接收者分组消息
    const messagesByReceiver = new Map<string, Array<{
      from: string
      message: unknown
      timestamp: number
    }>>()
    
    for (const msg of this.messageQueue) {
      if (!messagesByReceiver.has(msg.to)) {
        messagesByReceiver.set(msg.to, [])
      }
      messagesByReceiver.get(msg.to)!.push({
        from: msg.from,
        message: msg.message,
        timestamp: msg.timestamp,
      })
    }
    
    // 批量发送给每个接收者
    for (const [receiver, messages] of messagesByReceiver) {
      this.deliverBatchMessages(receiver, messages)
    }
    
    // 清空队列
    this.messageQueue = []
  }
  
  /**
   * 发送批量消息给Extension
   */
  private deliverBatchMessages(
    receiver: string,
    messages: Array<{
      from: string
      message: unknown
      timestamp: number
    }>
  ) {
    // 这里应该调用实际的Extension通信接口
    console.log(`Delivering ${messages.length} messages to ${receiver}`)
  }
  
  /**
   * 获取通信统计
   */
  getStats() {
    return {
      queuedMessages: this.messageQueue.length,
      hasPendingBatch: this.batchTimer !== null,
    }
  }
}

/**
 * Extension性能监控器
 * 监控Extension的加载时间、内存使用等性能指标
 */
export class ExtensionPerformanceMonitor {
  private metrics = new Map<string, {
    loadTime: number
    activationTime: number
    memoryUsage: number
    apiCalls: number
    errors: number
    lastActivity: number
  }>()
  
  /**
   * 记录Extension加载性能
   */
  recordLoad(extensionId: string, loadTime: number) {
    this.getOrCreateMetrics(extensionId).loadTime = loadTime
  }
  
  /**
   * 记录Extension激活性能
   */
  recordActivation(extensionId: string, activationTime: number) {
    this.getOrCreateMetrics(extensionId).activationTime = activationTime
    this.getOrCreateMetrics(extensionId).lastActivity = Date.now()
  }
  
  /**
   * 记录内存使用
   */
  recordMemoryUsage(extensionId: string, memoryUsage: number) {
    this.getOrCreateMetrics(extensionId).memoryUsage = memoryUsage
  }
  
  /**
   * 记录API调用
   */
  recordApiCall(extensionId: string) {
    const metrics = this.getOrCreateMetrics(extensionId)
    metrics.apiCalls++
    metrics.lastActivity = Date.now()
  }
  
  /**
   * 记录错误
   */
  recordError(extensionId: string) {
    const metrics = this.getOrCreateMetrics(extensionId)
    metrics.errors++
    metrics.lastActivity = Date.now()
  }
  
  /**
   * 获取Extension性能报告
   */
  getPerformanceReport(extensionId: string): {
    extensionId: string
    loadTime: number
    activationTime: number
    memoryUsage: number
    apiCalls: number
    errors: number
    lastActivity: number
    timestamp: number
    healthStatus: string
  } | null
  getPerformanceReport(): {
    totalExtensions: number
    averageLoadTime: number
    averageActivationTime: number
    totalApiCalls: number
    totalErrors: number
    extensions: Array<{
      id: string
      loadTime: number
      activationTime: number
      memoryUsage: number
      apiCalls: number
      errors: number
      lastActivity: number
    }>
  }
  getPerformanceReport(extensionId?: string) {
    if (extensionId) {
      const metrics = this.metrics.get(extensionId)
      if (!metrics) return null
      
      return {
        extensionId,
        ...metrics,
        timestamp: Date.now(),
        healthStatus: this.getHealthStatus(metrics)
      }
    }
    
    const report = {
      totalExtensions: this.metrics.size,
      averageLoadTime: 0,
      averageActivationTime: 0,
      totalApiCalls: 0,
      totalErrors: 0,
      extensions: [] as Array<{
        id: string
        loadTime: number
        activationTime: number
        memoryUsage: number
        apiCalls: number
        errors: number
        lastActivity: number
      }>
    }
    
    let totalLoadTime = 0
    let totalActivationTime = 0
    
    for (const [id, metrics] of this.metrics.entries()) {
      totalLoadTime += metrics.loadTime
      totalActivationTime += metrics.activationTime
      report.totalApiCalls += metrics.apiCalls
      report.totalErrors += metrics.errors
      
      report.extensions.push({
        id,
        ...metrics,
      })
    }
    
    if (this.metrics.size > 0) {
      report.averageLoadTime = totalLoadTime / this.metrics.size
      report.averageActivationTime = totalActivationTime / this.metrics.size
    }
    
    return report
  }
  
  /**
   * 获取单个Extension的指标
   */
  getMetrics(extensionId: string) {
    return this.metrics.get(extensionId) || null
  }
  
  /**
   * 获取所有Extension的指标
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics.entries())
  }
  
  
  /**
   * 清除Extension性能数据
   */
  clearMetrics(extensionId: string) {
    this.metrics.delete(extensionId)
  }
  
  /**
   * 获取健康状态
   */
  private getHealthStatus(metrics: {
    errors: number
    loadTime: number
  }) {
    // 简单的健康检查逻辑
    if (metrics.errors > 10 || metrics.loadTime > 5000) {
      return 'unhealthy'
    }
    if (metrics.errors > 5 || metrics.loadTime > 2000) {
      return 'warning'
    }
    return 'healthy'
  }
  
  /**
   * 获取或创建Extension指标
   */
  private getOrCreateMetrics(extensionId: string) {
    if (!this.metrics.has(extensionId)) {
      this.metrics.set(extensionId, {
        loadTime: 0,
        activationTime: 0,
        memoryUsage: 0,
        apiCalls: 0,
        errors: 0,
        lastActivity: Date.now(),
      })
    }
    return this.metrics.get(extensionId)!
  }
}

/**
 * 延迟加载管理器
 * 实现Extension的按需加载，提高启动性能
 */
export class LazyLoadManager {
  private loadPromises = new Map<string, Promise<unknown>>()
  private loadTriggers = new Map<string, Array<() => void>>()
  
  /**
   * 注册延迟加载的Extension
   */
  registerLazyExtension(
    extensionId: string,
    loadFn: () => Promise<unknown>,
    triggers: string[] = []
  ) {
    // 注册触发器
    for (const trigger of triggers) {
      if (!this.loadTriggers.has(trigger)) {
        this.loadTriggers.set(trigger, [])
      }
      this.loadTriggers.get(trigger)!.push(() => {
        this.loadExtension(extensionId, loadFn)
      })
    }
  }
  
  /**
   * 触发Extension加载
   */
  async triggerLoad(trigger: string) {
    const callbacks = this.loadTriggers.get(trigger) || []
    for (const callback of callbacks) {
      callback()
    }
  }
  
  /**
   * 加载Extension
   */
  private async loadExtension(extensionId: string, loadFn: () => Promise<unknown>) {
    if (this.loadPromises.has(extensionId)) {
      return this.loadPromises.get(extensionId)
    }
    
    const promise = loadFn()
    this.loadPromises.set(extensionId, promise)
    
    try {
      const result = await promise
      return result
    } catch (error) {
      this.loadPromises.delete(extensionId)
      throw error
    }
  }
  
  /**
   * 检查Extension是否已加载
   */
  isLoaded(extensionId: string): boolean {
    return this.loadPromises.has(extensionId)
  }
  
  /**
   * 获取加载统计
   */
  getStats() {
    return {
      loadedExtensions: this.loadPromises.size,
      registeredTriggers: this.loadTriggers.size,
    }
  }
}