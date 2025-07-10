/**
 * tRPC Client Factory for platform package
 * @module platform/trpc/client-factory
 */

import type { ExtensionContext } from '@linch-kit/core'

/**
 * tRPC客户端配置
 */
export interface TRPCClientConfig {
  url: string
  apiKey?: string
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  cache?: {
    enabled: boolean
    ttl?: number
  }
  auth?: {
    token?: string
    refreshToken?: string
    onUnauthorized?: () => void
  }
}

/**
 * tRPC客户端选项
 */
export interface TRPCClientOptions {
  baseUrl?: string
  headers?: Record<string, string>
  transformer?: {
    serialize: (data: unknown) => string
    deserialize: (data: string) => unknown
  }
  batch?: {
    enabled: boolean
    maxSize?: number
    timeout?: number
  }
}

/**
 * tRPC请求上下文
 */
export interface TRPCRequestContext {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
  signal?: AbortSignal
}

/**
 * tRPC响应结果
 */
export interface TRPCResponse<T = unknown> {
  result?: {
    data: T
  }
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * tRPC客户端工厂
 */
export class TRPCClientFactory {
  private config: TRPCClientConfig
  private extensionContext?: ExtensionContext

  constructor(config: TRPCClientConfig, extensionContext?: ExtensionContext) {
    this.config = config
    this.extensionContext = extensionContext
  }

  /**
   * 创建tRPC客户端
   */
  createClient<TRouter = unknown>(options: TRPCClientOptions = {}): TRPCClient<TRouter> {
    return new TRPCClient<TRouter>(this.config, options, this.extensionContext)
  }

  /**
   * 创建批量客户端
   */
  createBatchClient<TRouter = unknown>(options: TRPCClientOptions = {}): TRPCBatchClient<TRouter> {
    return new TRPCBatchClient<TRouter>(this.config, options, this.extensionContext)
  }

  /**
   * 创建WebSocket客户端
   */
  createWSClient<TRouter = unknown>(
    wsUrl: string,
    options: TRPCClientOptions = {}
  ): TRPCWSClient<TRouter> {
    return new TRPCWSClient<TRouter>(wsUrl, this.config, options, this.extensionContext)
  }
}

/**
 * tRPC客户端基类
 */
export abstract class BaseTRPCClient<_TRouter = unknown> {
  protected config: TRPCClientConfig
  protected options: TRPCClientOptions
  protected extensionContext?: ExtensionContext

  constructor(
    config: TRPCClientConfig,
    options: TRPCClientOptions = {},
    extensionContext?: ExtensionContext
  ) {
    this.config = config
    this.options = options
    this.extensionContext = extensionContext
  }

  /**
   * 构建请求URL
   */
  protected buildUrl(path: string): string {
    const baseUrl = this.options.baseUrl || this.config.url
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  /**
   * 构建请求头
   */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...this.options.headers,
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    if (this.config.auth?.token) {
      headers['Authorization'] = `Bearer ${this.config.auth.token}`
    }

    return headers
  }

  /**
   * 处理错误
   */
  protected handleError(error: unknown): Error {
    if (error instanceof Error) {
      this.extensionContext?.logger.error('tRPC client error', error)
      return error
    }

    const errorMessage = String(error)
    this.extensionContext?.logger.error('tRPC client error', { message: errorMessage })
    return new Error(errorMessage)
  }

  /**
   * 序列化数据
   */
  protected serialize(data: unknown): string {
    if (this.options.transformer?.serialize) {
      return this.options.transformer.serialize(data)
    }
    return JSON.stringify(data)
  }

  /**
   * 反序列化数据
   */
  protected deserialize<T>(data: string): T {
    if (this.options.transformer?.deserialize) {
      return this.options.transformer.deserialize(data) as T
    }
    return JSON.parse(data) as T
  }

  /**
   * 抽象方法：执行查询
   */
  abstract query<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput
  ): Promise<TOutput>

  /**
   * 抽象方法：执行变更
   */
  abstract mutate<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput
  ): Promise<TOutput>

  /**
   * 抽象方法：订阅
   */
  abstract subscribe<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput,
    onData?: (data: TOutput) => void,
    onError?: (error: Error) => void
  ): () => void
}

/**
 * 标准tRPC客户端
 */
export class TRPCClient<TRouter = unknown> extends BaseTRPCClient<TRouter> {
  /**
   * 执行查询
   */
  async query<TInput = unknown, TOutput = unknown>(path: string, input?: TInput): Promise<TOutput> {
    const url = this.buildUrl(path)
    const headers = this.buildHeaders()

    const queryParams = input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : ''
    const fullUrl = `${url}${queryParams}`

    this.extensionContext?.logger.info(`tRPC query: ${path}`, { input })

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.text()
      const result = this.deserialize<TRPCResponse<TOutput>>(data)

      if (result.error) {
        throw new Error(`tRPC Error ${result.error.code}: ${result.error.message}`)
      }

      return result.result!.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 执行变更
   */
  async mutate<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput
  ): Promise<TOutput> {
    const url = this.buildUrl(path)
    const headers = this.buildHeaders()

    this.extensionContext?.logger.info(`tRPC mutation: ${path}`, { input })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: this.serialize(input),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.text()
      const result = this.deserialize<TRPCResponse<TOutput>>(data)

      if (result.error) {
        throw new Error(`tRPC Error ${result.error.code}: ${result.error.message}`)
      }

      return result.result!.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 订阅（基于轮询的简单实现）
   */
  subscribe<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput,
    onData?: (data: TOutput) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isSubscribed = true
    let intervalId: Timer

    const poll = async () => {
      if (!isSubscribed) return

      try {
        const data = await this.query<TInput, TOutput>(path, input)
        onData?.(data)
      } catch (error) {
        onError?.(this.handleError(error))
      }
    }

    // 立即执行一次
    poll()

    // 设置轮询
    intervalId = setInterval(poll, 5000)

    // 返回取消订阅函数
    return () => {
      isSubscribed = false
      clearInterval(intervalId)
    }
  }
}

/**
 * 批量tRPC客户端
 */
export class TRPCBatchClient<TRouter = unknown> extends BaseTRPCClient<TRouter> {
  private batchQueue: Array<{
    id: string
    path: string
    input?: unknown
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }> = []
  private batchTimeout: Timer | null = null

  /**
   * 执行查询（批量）
   */
  async query<TInput = unknown, TOutput = unknown>(path: string, input?: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9)

      this.batchQueue.push({
        id,
        path,
        input,
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      this.scheduleBatch()
    })
  }

  /**
   * 执行变更（批量）
   */
  async mutate<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput
  ): Promise<TOutput> {
    // 变更不适合批量处理，直接执行
    return new TRPCClient<TRouter>(this.config, this.options, this.extensionContext).mutate<
      TInput,
      TOutput
    >(path, input)
  }

  /**
   * 订阅
   */
  subscribe<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput,
    onData?: (data: TOutput) => void,
    onError?: (error: Error) => void
  ): () => void {
    return new TRPCClient<TRouter>(this.config, this.options, this.extensionContext).subscribe(
      path,
      input,
      onData,
      onError
    )
  }

  /**
   * 调度批量请求
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) return

    this.batchTimeout = setTimeout(() => {
      this.executeBatch()
      this.batchTimeout = null
    }, this.options.batch?.timeout || 10)
  }

  /**
   * 执行批量请求
   */
  private async executeBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const batch = this.batchQueue.splice(0, this.options.batch?.maxSize || 10)
    const url = this.buildUrl('batch')
    const headers = this.buildHeaders()

    const batchInput = batch.map(item => ({
      id: item.id,
      path: item.path,
      input: item.input,
    }))

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: this.serialize(batchInput),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.text()
      const results =
        this.deserialize<
          Array<{
            id: string
            result?: { data: unknown }
            error?: { code: number; message: string }
          }>
        >(data)

      // 处理每个结果
      for (const result of results) {
        const batchItem = batch.find(item => item.id === result.id)
        if (!batchItem) continue

        if (result.error) {
          batchItem.reject(new Error(`tRPC Error ${result.error.code}: ${result.error.message}`))
        } else {
          batchItem.resolve(result.result!.data)
        }
      }
    } catch (error) {
      // 批量请求失败，拒绝所有请求
      const err = this.handleError(error)
      batch.forEach(item => item.reject(err))
    }
  }
}

/**
 * WebSocket tRPC客户端
 */
export class TRPCWSClient<TRouter = unknown> extends BaseTRPCClient<TRouter> {
  private ws: WebSocket | null = null
  private wsUrl: string
  private subscriptions = new Map<
    string,
    {
      onData: (data: unknown) => void
      onError: (error: Error) => void
    }
  >()

  constructor(
    wsUrl: string,
    config: TRPCClientConfig,
    options: TRPCClientOptions = {},
    extensionContext?: ExtensionContext
  ) {
    super(config, options, extensionContext)
    this.wsUrl = wsUrl
    this.connect()
  }

  /**
   * 连接WebSocket
   */
  private connect(): void {
    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        this.extensionContext?.logger.info('tRPC WebSocket connected')
      }

      this.ws.onmessage = event => {
        try {
          const data = this.deserialize(event.data)
          this.handleMessage(data)
        } catch (error) {
          this.extensionContext?.logger.error('Failed to parse WebSocket message', error)
        }
      }

      this.ws.onclose = () => {
        this.extensionContext?.logger.info('tRPC WebSocket disconnected')
        // 重连逻辑
        setTimeout(() => this.connect(), 5000)
      }

      this.ws.onerror = error => {
        this.extensionContext?.logger.error('tRPC WebSocket error', error)
      }
    } catch (error) {
      this.extensionContext?.logger.error('Failed to connect WebSocket', error)
    }
  }

  /**
   * 处理WebSocket消息
   */
  private handleMessage(data: unknown): void {
    // 简化的消息处理逻辑
    if (typeof data === 'object' && data && 'id' in data && 'result' in data) {
      const message = data as { id: string; result: unknown }
      const subscription = this.subscriptions.get(message.id)
      if (subscription) {
        subscription.onData(message.result)
      }
    }
  }

  /**
   * 执行查询（通过HTTP）
   */
  async query<TInput = unknown, TOutput = unknown>(path: string, input?: TInput): Promise<TOutput> {
    return new TRPCClient<TRouter>(this.config, this.options, this.extensionContext).query<
      TInput,
      TOutput
    >(path, input)
  }

  /**
   * 执行变更（通过HTTP）
   */
  async mutate<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput
  ): Promise<TOutput> {
    return new TRPCClient<TRouter>(this.config, this.options, this.extensionContext).mutate<
      TInput,
      TOutput
    >(path, input)
  }

  /**
   * 订阅（通过WebSocket）
   */
  subscribe<TInput = unknown, TOutput = unknown>(
    path: string,
    input?: TInput,
    onData?: (data: TOutput) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriptionId = Math.random().toString(36).substr(2, 9)

    if (onData && onError) {
      this.subscriptions.set(subscriptionId, {
        onData: onData as (data: unknown) => void,
        onError,
      })
    }

    // 发送订阅消息
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        id: subscriptionId,
        type: 'subscribe',
        path,
        input,
      }

      this.ws.send(this.serialize(message))
    }

    // 返回取消订阅函数
    return () => {
      this.subscriptions.delete(subscriptionId)

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          id: subscriptionId,
          type: 'unsubscribe',
        }

        this.ws.send(this.serialize(message))
      }
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscriptions.clear()
  }
}

/**
 * 创建tRPC客户端工厂的便捷函数
 */
export function createTRPCClientFactory(
  config: TRPCClientConfig,
  extensionContext?: ExtensionContext
): TRPCClientFactory {
  return new TRPCClientFactory(config, extensionContext)
}
