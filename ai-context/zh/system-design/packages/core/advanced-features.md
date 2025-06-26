# @linch-kit/core 高级特性

> **文档类型**: 高级特性  
> **适用场景**: 生产环境优化

## 🔌 插件系统扩展性

### 插件类型扩展
@linch-kit/core 的插件系统设计了扩展点，支持未来添加新的插件类型：

```typescript
// 插件元数据支持类型扩展
interface PluginMetadata {
  id: string
  name: string
  version: string
  type?: 'local' | 'remote' | string  // 可扩展的插件类型
  extensions?: Record<string, unknown>  // 自定义扩展数据
}

// 插件扩展处理器接口（预留）
interface PluginExtensionHandler {
  register(plugin: Plugin, config?: PluginConfig): Promise<OperationResult>
  start?(pluginId: string): Promise<OperationResult>
  stop?(pluginId: string): Promise<OperationResult>
}

// 注册自定义插件类型（未来）
pluginRegistry.registerExtension('remote', remotePluginHandler)
pluginRegistry.registerExtension('wasm', wasmPluginHandler)
```

### 远程插件支持（规划中）
虽然 MVP 版本仅支持本地插件，但架构设计已考虑未来的远程插件需求：

- **多语言支持**: Python、Go、Rust 等语言编写的插件
- **进程隔离**: 插件运行在独立进程或容器中
- **通信协议**: gRPC、HTTP、WebSocket 等
- **分布式部署**: 插件可以部署在不同的服务器上

### 扩展包生态（社区驱动）
```
@linch-kit/plugin-remote-grpc     # gRPC 远程插件支持
@linch-kit/plugin-remote-http     # HTTP 远程插件支持
@linch-kit/plugin-docker          # Docker 容器插件支持
@linch-kit/plugin-wasm            # WebAssembly 插件支持
```

## 🏢 企业级特性

### 多租户架构
```typescript
// 租户隔离配置
interface TenantIsolationConfig {
  database: {
    strategy: 'schema' | 'database' | 'table'
    prefix?: string
  }
  cache: {
    keyPrefix: string
    isolateNamespaces: boolean
  }
  storage: {
    basePath: string
    encryption: boolean
  }
}

class TenantManager {
  async createTenant(config: TenantConfig): Promise<Tenant> {
    // 1. 创建租户数据库结构
    await this.setupTenantDatabase(config)
    
    // 2. 初始化租户配置
    await this.initializeTenantConfig(config)
    
    // 3. 设置资源限制
    await this.setResourceQuotas(config)
    
    return new Tenant(config)
  }
}
```

### 权限和安全
```typescript
// 基础审计日志
interface AuditEvent {
  timestamp: Date
  tenantId: string
  userId: string
  action: string
  resource: string
  outcome: 'success' | 'failure'
  metadata?: Record<string, any>
}

class AuditLogger {
  async logEvent(event: AuditEvent): Promise<void> {
    // 1. 数据脱敏
    const sanitized = this.sanitizeEvent(event)
    
    // 2. 写入审计日志
    await this.writeAuditLog(sanitized)
    
    // 3. 实时告警检查
    await this.checkAlerts(sanitized)
  }
  
  private sanitizeEvent(event: AuditEvent): AuditEvent {
    // 移除敏感信息
    return {
      ...event,
      metadata: this.sanitizeMetadata(event.metadata)
    }
  }
}
```

## ⚡ 性能优化

### 智能缓存策略
```typescript
interface CacheStrategy {
  type: 'memory' | 'redis' | 'hybrid'
  ttl: number
  maxSize?: number
  evictionPolicy?: 'lru' | 'lfu' | 'fifo'
}

class SmartCache {
  private strategies = new Map<string, CacheStrategy>()
  
  setStrategy(namespace: string, strategy: CacheStrategy): void {
    this.strategies.set(namespace, strategy)
  }
  
  async get<T>(key: string): Promise<T | null> {
    const strategy = this.getStrategy(key)
    
    switch (strategy.type) {
      case 'memory':
        return this.getFromMemory(key)
      case 'redis':
        return this.getFromRedis(key)
      case 'hybrid':
        return this.getHybrid(key)
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const strategy = this.getStrategy(key)
    const effectiveTtl = ttl || strategy.ttl
    
    // 异步写入多层缓存
    await Promise.all([
      this.setInMemory(key, value, effectiveTtl),
      this.setInRedis(key, value, effectiveTtl)
    ])
  }
}
```

### 连接池管理 (基于 generic-pool)
```typescript
import { createPool, Pool, Factory } from 'generic-pool' // 使用成熟的连接池库

/**
 * ConnectionPoolManager - 基于 generic-pool 的连接池管理
 * 
 * 设计原则：
 * - 使用 generic-pool 库，而不是自己实现连接池逻辑
 * - 提供 LinchKit 风格的适配器接口
 * - 集成监控和诊断功能
 */
class ConnectionPoolManager {
  private pools = new Map<string, Pool<unknown>>()
  
  createPool<T>(
    name: string, 
    factory: Factory<T>, 
    options: PoolOptions
  ): void {
    // 直接使用 generic-pool 的成熟实现
    const pool = createPool(factory, {
      max: options.maxConnections || 10,
      min: options.minConnections || 2,
      acquireTimeoutMillis: options.timeout || 30000,
      testOnBorrow: true,
      testOnReturn: false,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      ...options
    })
    
    this.pools.set(name, pool as Pool<unknown>)
    
    // 使用 prom-client 集成监控，而不是自己实现
    this.setupPoolMetrics(name, pool as Pool<unknown>)
  }
  
  async acquire<T>(poolName: string): Promise<T> {
    const pool = this.pools.get(poolName)
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`)
    }
    
    // generic-pool 已经处理了所有连接获取逻辑
    return await pool.acquire() as T
  }
  
  async release<T>(poolName: string, resource: T): Promise<void> {
    const pool = this.pools.get(poolName)
    if (pool) {
      await pool.release(resource)
    }
  }
  
  private setupPoolMetrics(name: string, pool: Pool<unknown>): void {
    // 使用 prom-client 暴露连接池指标
    const gaugeSize = new Gauge({
      name: `linchkit_pool_size_${name}`,
      help: `Current size of ${name} connection pool`,
      collect() {
        this.set(pool.size)
      }
    })
    
    const gaugeAvailable = new Gauge({
      name: `linchkit_pool_available_${name}`,
      help: `Available connections in ${name} pool`,
      collect() {
        this.set(pool.available)
      }
    })
  }
}
```

## 📊 高级监控

### 自定义指标聚合
```typescript
class MetricsAggregator {
  private aggregators = new Map<string, Aggregator>()
  
  registerAggregator(name: string, config: AggregatorConfig): void {
    const aggregator = new Aggregator({
      window: config.timeWindow,
      function: config.aggregateFunction,
      labels: config.groupByLabels
    })
    
    this.aggregators.set(name, aggregator)
  }
  
  aggregate(metricName: string, value: number, labels: Record<string, string>): void {
    const aggregator = this.aggregators.get(metricName)
    if (aggregator) {
      aggregator.add(value, labels, Date.now())
    }
  }
  
  getAggregatedMetrics(name: string): AggregatedMetric[] {
    const aggregator = this.aggregators.get(name)
    return aggregator ? aggregator.getResults() : []
  }
}
```

### 分布式追踪高级配置
```typescript
class AdvancedTracing {
  private samplingRules = new Map<string, SamplingRule>()
  
  addSamplingRule(name: string, rule: SamplingRule): void {
    this.samplingRules.set(name, rule)
  }
  
  shouldSample(spanName: string, context: SpanContext): boolean {
    for (const [name, rule] of this.samplingRules) {
      if (rule.matches(spanName, context)) {
        return Math.random() < rule.samplingRate
      }
    }
    
    return false // 默认不采样
  }
  
  createSpanWithContext(name: string, context: SpanContext): Span {
    const span = tracer.startSpan(name, {
      parent: context.parentSpan,
      attributes: {
        'service.name': context.serviceName,
        'tenant.id': context.tenantId,
        'user.id': context.userId
      }
    })
    
    // 添加自定义标签
    if (this.shouldSample(name, context)) {
      span.setAttribute('sampling.decision', 'sampled')
    }
    
    return span
  }
}
```

## 🔧 插件生态系统

### 插件市场集成
```typescript
interface PluginMarketplace {
  search(query: string, filters?: PluginFilter[]): Promise<PluginInfo[]>
  install(pluginId: string, version?: string): Promise<void>
  uninstall(pluginId: string): Promise<void>
  update(pluginId: string, version?: string): Promise<void>
  getInstalled(): Promise<InstalledPlugin[]>
}

class PluginMarketplaceClient implements PluginMarketplace {
  constructor(private apiEndpoint: string, private apiKey: string) {}
  
  async install(pluginId: string, version = 'latest'): Promise<void> {
    // 1. 下载插件包
    const packageData = await this.downloadPlugin(pluginId, version)
    
    // 2. 验证插件签名
    await this.verifyPluginSignature(packageData)
    
    // 3. 检查依赖关系
    await this.resolveDependencies(packageData.manifest)
    
    // 4. 安装插件
    await this.installPlugin(packageData)
    
    // 5. 注册到插件系统
    await PluginSystem.register(packageData.plugin)
  }
}
```

### 插件沙箱
```typescript
class PluginSandbox {
  private isolatedGlobals = new Map<string, any>()
  
  async executePlugin(plugin: Plugin, method: string, args: any[]): Promise<any> {
    const sandbox = this.createSandbox(plugin.id)
    
    try {
      // 在沙箱中执行插件代码
      const result = await this.runInSandbox(sandbox, () => {
        return plugin[method](...args)
      })
      
      return result
    } catch (error) {
      Logger.error(`Plugin ${plugin.id} execution failed`, error)
      throw new PluginExecutionError(plugin.id, error.message)
    } finally {
      this.cleanupSandbox(sandbox)
    }
  }
  
  private createSandbox(pluginId: string): SandboxContext {
    return {
      pluginId,
      globals: this.createRestrictedGlobals(),
      resources: this.createResourceLimits(),
      permissions: this.getPluginPermissions(pluginId)
    }
  }
}
```

## 🌊 流量控制

### 限流器 (基于 express-rate-limit + bottleneck)
```typescript
import rateLimit from 'express-rate-limit' // Express 生态成熟限流库
import Bottleneck from 'bottleneck' // 高级限流和队列管理
import RedisStore from 'rate-limit-redis' // Redis 后端存储

/**
 * RateLimiter - 基于成熟限流库的适配器
 * 
 * 设计原则：
 * - 使用 express-rate-limit 处理 HTTP 限流
 * - 使用 bottleneck 处理应用级限流和队列
 * - 使用 rate-limit-redis 实现分布式限流
 */

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  strategy: 'express' | 'bottleneck' | 'redis'
  keyGenerator?: (context: unknown) => string
}

class RateLimiter {
  private expressLimiters = new Map<string, any>()
  private bottleneckLimiters = new Map<string, Bottleneck>()
  
  createLimiter(name: string, config: RateLimitConfig): void {
    switch (config.strategy) {
      case 'express':
        this.createExpressLimiter(name, config)
        break
      case 'bottleneck':
        this.createBottleneckLimiter(name, config)
        break
      case 'redis':
        this.createRedisLimiter(name, config)
        break
    }
  }
  
  private createExpressLimiter(name: string, config: RateLimitConfig): void {
    // 使用 express-rate-limit 的成熟实现
    const limiter = rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests,
      keyGenerator: config.keyGenerator as any,
      standardHeaders: true,
      legacyHeaders: false,
    })
    
    this.expressLimiters.set(name, limiter)
  }
  
  private createBottleneckLimiter(name: string, config: RateLimitConfig): void {
    // 使用 bottleneck 进行高级限流控制
    const limiter = new Bottleneck({
      maxConcurrent: config.maxRequests,
      minTime: Math.floor(config.windowMs / config.maxRequests),
      reservoir: config.maxRequests,
      reservoirRefreshAmount: config.maxRequests,
      reservoirRefreshInterval: config.windowMs,
    })
    
    this.bottleneckLimiters.set(name, limiter)
  }
  
  private createRedisLimiter(name: string, config: RateLimitConfig): void {
    // 使用 rate-limit-redis 实现分布式限流
    const limiter = rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests,
      store: new RedisStore({
        // Redis 配置
        sendCommand: (...args: string[]) => redisClient.call(...args),
      }),
    })
    
    this.expressLimiters.set(name, limiter)
  }
  
  async checkLimit(limiterName: string, context: unknown): Promise<RateLimitResult> {
    const bottleneckLimiter = this.bottleneckLimiters.get(limiterName)
    if (bottleneckLimiter) {
      // 使用 bottleneck 检查限流
      const reservoir = await bottleneckLimiter.currentReservoir()
      return {
        allowed: reservoir > 0,
        remaining: reservoir,
        resetTime: Date.now() + bottleneckLimiter.chain._store.clientId
      }
    }
    
    // 对于 express 限流器，需要在 HTTP 中间件中使用
    return { allowed: true, remaining: Infinity }
  }
}
```

### 断路器 (基于 opossum)
```typescript
import CircuitBreaker from 'opossum' // 使用成熟的断路器库

/**
 * LinchKit CircuitBreaker - 基于 opossum 的断路器适配器
 * 
 * 设计原则：
 * - 使用 opossum 库，而不是自己实现断路器逻辑
 * - 提供 LinchKit 风格的配置和监控
 * - 集成 Prometheus 指标
 */
class LinchKitCircuitBreaker {
  private breakers = new Map<string, CircuitBreaker>()
  
  createBreaker<T>(name: string, fn: (...args: unknown[]) => Promise<T>, options?: {
    timeout?: number
    errorThresholdPercentage?: number
    resetTimeout?: number
    rollingCountTimeout?: number
  }): CircuitBreaker<unknown[], T> {
    
    // 使用 opossum 的成熟实现，而不是自己重新实现
    const breaker = new CircuitBreaker(fn, {
      timeout: options?.timeout || 3000,
      errorThresholdPercentage: options?.errorThresholdPercentage || 50,
      resetTimeout: options?.resetTimeout || 30000,
      rollingCountTimeout: options?.rollingCountTimeout || 10000,
      rollingCountBuckets: 10,
      name,
    })
    
    // 集成 Prometheus 监控
    this.setupBreakerMetrics(name, breaker)
    
    // 设置事件监听
    this.setupEventListeners(name, breaker)
    
    this.breakers.set(name, breaker)
    return breaker
  }
  
  private setupBreakerMetrics(name: string, breaker: CircuitBreaker): void {
    // 使用 prom-client 暴露断路器指标
    const stateGauge = new Gauge({
      name: `linchkit_circuit_breaker_state`,
      help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
      labelNames: ['breaker_name'],
    })
    
    const requestsCounter = new Counter({
      name: `linchkit_circuit_breaker_requests_total`,
      help: 'Total circuit breaker requests',
      labelNames: ['breaker_name', 'state'],
    })
    
    // opossum 提供了丰富的事件
    breaker.on('open', () => {
      stateGauge.set({ breaker_name: name }, 1)
    })
    
    breaker.on('close', () => {
      stateGauge.set({ breaker_name: name }, 0)
    })
    
    breaker.on('halfOpen', () => {
      stateGauge.set({ breaker_name: name }, 2)
    })
    
    breaker.on('success', () => {
      requestsCounter.inc({ breaker_name: name, state: 'success' })
    })
    
    breaker.on('failure', () => {
      requestsCounter.inc({ breaker_name: name, state: 'failure' })
    })
  }
  
  private setupEventListeners(name: string, breaker: CircuitBreaker): void {
    breaker.on('open', () => {
      Logger.warn(`Circuit breaker ${name} opened`)
    })
    
    breaker.on('halfOpen', () => {
      Logger.info(`Circuit breaker ${name} half-opened`)
    })
    
    breaker.on('close', () => {
      Logger.info(`Circuit breaker ${name} closed`)
    })
  }
  
  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name)
  }
  
  // 获取所有断路器的状态 - 用于健康检查
  getStatus(): Record<string, { state: string; stats: any }> {
    const status: Record<string, { state: string; stats: any }> = {}
    
    for (const [name, breaker] of this.breakers) {
      status[name] = {
        state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
        stats: breaker.stats
      }
    }
    
    return status
  }
}
```

## 📈 性能基准测试

### 基准测试框架 (基于 tinybench)
```typescript
import { Bench } from 'tinybench' // 使用 tinybench 而不是重复造轮子

/**
 * PerformanceBenchmark - 基于 tinybench 的性能基准测试
 * 
 * 设计原则：
 * - 使用 tinybench 进行基准测试，而不是自己实现
 * - 集成回归检测和报告功能
 * - 支持持久化和比较基线
 */
class PerformanceBenchmark {
  private bench = new Bench({
    time: 1000, // 每个测试运行1秒
    iterations: 10,
    warmupTime: 100,
    warmupIterations: 5,
  })
  private baselines = new Map<string, BenchmarkResult>()
  
  addTest(name: string, fn: () => unknown): void {
    // 直接使用 tinybench 的 API
    this.bench.add(name, fn)
  }
  
  async run(): Promise<BenchmarkResults> {
    await this.bench.run()
    
    // 使用 tinybench 的结果格式
    const results = this.bench.tasks.map(task => ({
      name: task.name || 'unnamed',
      opsPerSec: task.result?.hz || 0,
      avgTime: task.result?.mean || 0,
      variance: task.result?.variance || 0,
      samples: task.result?.samples?.length || 0,
      error: task.result?.error,
    }))
    
    return {
      timestamp: new Date(),
      results,
      regressions: this.detectRegressions(results),
      summary: this.generateSummary(results)
    }
  }
  
  detectRegressions(current: BenchmarkResult[]): Regression[] {
    const regressions: Regression[] = []
    
    for (const result of current) {
      const baseline = this.baselines.get(result.name)
      if (baseline && result.opsPerSec < baseline.opsPerSec * 0.9) {
        regressions.push({
          test: result.name,
          currentPerf: result.opsPerSec,
          baselinePerf: baseline.opsPerSec,
          degradation: (baseline.opsPerSec - result.opsPerSec) / baseline.opsPerSec
        })
      }
    }
    
    return regressions
  }
  
  private generateSummary(results: BenchmarkResult[]): BenchmarkSummary {
    const fastest = results.reduce((prev, current) => 
      current.opsPerSec > prev.opsPerSec ? current : prev
    )
    
    return {
      totalTests: results.length,
      fastestTest: fastest.name,
      averageOpsPerSec: results.reduce((sum, r) => sum + r.opsPerSec, 0) / results.length,
      hasRegressions: this.detectRegressions(results).length > 0
    }
  }
  
  saveBaseline(results: BenchmarkResult[]): void {
    for (const result of results) {
      this.baselines.set(result.name, result)
    }
  }
  
  loadBaseline(baselineData: Record<string, BenchmarkResult>): void {
    this.baselines = new Map(Object.entries(baselineData))
  }
}

interface BenchmarkResult {
  name: string
  opsPerSec: number
  avgTime: number
  variance: number
  samples: number
  error?: Error
}

interface BenchmarkResults {
  timestamp: Date
  results: BenchmarkResult[]
  regressions: Regression[]
  summary: BenchmarkSummary
}

interface Regression {
  test: string
  currentPerf: number
  baselinePerf: number
  degradation: number
}

interface BenchmarkSummary {
  totalTests: number
  fastestTest: string
  averageOpsPerSec: number
  hasRegressions: boolean
}
```