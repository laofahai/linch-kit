/**
 * Extension 间通信机制
 * @module core/extension-communication
 */

import { EventEmitter } from 'eventemitter3'
import type { ExtensionInstance } from '@linch-kit/core/client'

import { extensionLoader } from './extension-loader'

/**
 * 通信消息类型
 */
export type ExtensionMessageType = 'request' | 'response' | 'notification' | 'broadcast' | 'error'

/**
 * Extension 消息结构
 */
export interface ExtensionMessage {
  /** 消息ID */
  id: string
  /** 消息类型 */
  type: ExtensionMessageType
  /** 发送者 Extension */
  from: string
  /** 接收者 Extension */
  to: string | string[]
  /** 消息主题 */
  subject: string
  /** 消息内容 */
  payload: unknown
  /** 时间戳 */
  timestamp: number
  /** 消息优先级 */
  priority?: 'low' | 'normal' | 'high'
  /** 是否需要确认 */
  requiresAck?: boolean
  /** 响应消息ID（用于响应消息） */
  responseId?: string
}

/**
 * 消息处理器
 */
export type ExtensionMessageHandler = (
  message: ExtensionMessage,
  context: ExtensionMessageContext
) => Promise<unknown> | unknown

/**
 * 消息上下文
 */
export interface ExtensionMessageContext {
  /** 发送者实例 */
  sender: ExtensionInstance
  /** 接收者实例 */
  receiver: ExtensionInstance
  /** 回复消息 */
  reply: (payload: unknown) => Promise<void>
  /** 发送错误 */
  error: (error: Error) => Promise<void>
}

/**
 * 消息订阅
 */
export interface ExtensionMessageSubscription {
  /** Extension 名称 */
  extensionName: string
  /** 订阅的主题 */
  subject: string
  /** 消息处理器 */
  handler: ExtensionMessageHandler
  /** 订阅时间 */
  subscribedAt: number
}

/**
 * 消息统计
 */
export interface ExtensionMessageStats {
  /** 总消息数 */
  totalMessages: number
  /** 按类型统计 */
  byType: Record<ExtensionMessageType, number>
  /** 按Extension统计 */
  byExtension: Record<string, { sent: number; received: number }>
  /** 错误消息数 */
  errorCount: number
  /** 未送达消息数 */
  undeliveredCount: number
}

/**
 * Extension 通信中心
 *
 * 功能：
 * - Extension 间消息传递
 * - 消息路由和分发
 * - 消息队列管理
 * - 权限验证
 * - 统计和监控
 */
export class ExtensionCommunicationHub extends EventEmitter {
  private messageHandlers = new Map<string, Map<string, ExtensionMessageHandler>>()
  private subscriptions = new Map<string, ExtensionMessageSubscription[]>()
  private messageQueue = new Map<string, ExtensionMessage[]>()
  private messageHistory: ExtensionMessage[] = []
  private stats: ExtensionMessageStats = {
    totalMessages: 0,
    byType: {
      request: 0,
      response: 0,
      notification: 0,
      broadcast: 0,
      error: 0,
    },
    byExtension: {},
    errorCount: 0,
    undeliveredCount: 0,
  }

  constructor() {
    super()
    this.setupMessageDelivery()
  }

  /**
   * 注册消息处理器
   */
  registerMessageHandler(
    extensionName: string,
    subject: string,
    handler: ExtensionMessageHandler
  ): void {
    if (!this.messageHandlers.has(extensionName)) {
      this.messageHandlers.set(extensionName, new Map())
    }

    const extensionHandlers = this.messageHandlers.get(extensionName)!
    extensionHandlers.set(subject, handler)

    // 处理队列中的消息
    this.processQueuedMessages(extensionName, subject)
  }

  /**
   * 注销消息处理器
   */
  unregisterMessageHandler(extensionName: string, subject: string): void {
    const extensionHandlers = this.messageHandlers.get(extensionName)
    if (extensionHandlers) {
      extensionHandlers.delete(subject)

      if (extensionHandlers.size === 0) {
        this.messageHandlers.delete(extensionName)
      }
    }
  }

  /**
   * 订阅消息主题
   */
  subscribe(extensionName: string, subject: string, handler: ExtensionMessageHandler): () => void {
    const subscription: ExtensionMessageSubscription = {
      extensionName,
      subject,
      handler,
      subscribedAt: Date.now(),
    }

    const extensionSubs = this.subscriptions.get(extensionName) || []
    extensionSubs.push(subscription)
    this.subscriptions.set(extensionName, extensionSubs)

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(extensionName, subject, handler)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(extensionName: string, subject: string, handler: ExtensionMessageHandler): void {
    const extensionSubs = this.subscriptions.get(extensionName) || []
    const filteredSubs = extensionSubs.filter(
      sub => sub.subject !== subject || sub.handler !== handler
    )

    if (filteredSubs.length === 0) {
      this.subscriptions.delete(extensionName)
    } else {
      this.subscriptions.set(extensionName, filteredSubs)
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(message: Omit<ExtensionMessage, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: ExtensionMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    }

    // 验证权限
    if (!this.validateMessagePermission(fullMessage)) {
      throw new Error(`Extension ${message.from} does not have permission to send message`)
    }

    // 更新统计
    this.updateStats(fullMessage)

    // 添加到历史记录
    this.messageHistory.push(fullMessage)

    // 限制历史记录大小
    if (this.messageHistory.length > 1000) {
      this.messageHistory.shift()
    }

    // 路由消息
    await this.routeMessage(fullMessage)

    // 触发消息发送事件
    this.emit('messageSent', fullMessage)

    return fullMessage.id
  }

  /**
   * 发送请求消息
   */
  async sendRequest(
    from: string,
    to: string,
    subject: string,
    payload: unknown,
    _timeout: number = 5000
  ): Promise<unknown> {
    const messageId = await this.sendMessage({
      type: 'request',
      from,
      to,
      subject,
      payload,
      requiresAck: true,
    })

    // 等待响应
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(`response:${messageId}`, responseHandler)
        reject(new Error(`Request timeout after ${_timeout}ms`))
      }, _timeout)

      const responseHandler = (response: ExtensionMessage) => {
        clearTimeout(timeoutId)
        if (response.type === 'error') {
          reject(new Error((response.payload as { message?: string }).message || 'Request failed'))
        } else {
          resolve(response.payload)
        }
      }

      this.once(`response:${messageId}`, responseHandler)
    })
  }

  /**
   * 发送响应消息
   */
  async sendResponse(
    originalMessage: ExtensionMessage,
    payload: unknown,
    isError: boolean = false
  ): Promise<void> {
    await this.sendMessage({
      type: isError ? 'error' : 'response',
      from: originalMessage.to as string,
      to: originalMessage.from,
      subject: originalMessage.subject,
      payload,
      responseId: originalMessage.id,
    })
  }

  /**
   * 发送通知消息
   */
  async sendNotification(
    from: string,
    to: string | string[],
    subject: string,
    payload: unknown
  ): Promise<void> {
    await this.sendMessage({
      type: 'notification',
      from,
      to,
      subject,
      payload,
    })
  }

  /**
   * 发送广播消息
   */
  async sendBroadcast(
    from: string,
    subject: string,
    payload: unknown,
    exclude?: string[]
  ): Promise<void> {
    const loadedExtensions = extensionLoader.getLoadedExtensions()
    const recipients = loadedExtensions
      .map(ext => ext.name)
      .filter(name => name !== from && !exclude?.includes(name))

    await this.sendMessage({
      type: 'broadcast',
      from,
      to: recipients,
      subject,
      payload,
    })
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(
    extensionName?: string,
    subject?: string,
    limit: number = 100
  ): ExtensionMessage[] {
    let filtered = this.messageHistory

    if (extensionName) {
      filtered = filtered.filter(
        msg =>
          msg.from === extensionName ||
          msg.to === extensionName ||
          (Array.isArray(msg.to) && msg.to.includes(extensionName))
      )
    }

    if (subject) {
      filtered = filtered.filter(msg => msg.subject === subject)
    }

    return filtered.slice(-limit)
  }

  /**
   * 获取消息统计
   */
  getMessageStats(): ExtensionMessageStats {
    return { ...this.stats }
  }

  /**
   * 获取Extension的订阅列表
   */
  getSubscriptions(extensionName: string): ExtensionMessageSubscription[] {
    return this.subscriptions.get(extensionName) || []
  }

  /**
   * 清理Extension的所有通信资源
   */
  cleanup(extensionName: string): void {
    this.messageHandlers.delete(extensionName)
    this.subscriptions.delete(extensionName)
    this.messageQueue.delete(extensionName)

    // 清理统计信息
    delete this.stats.byExtension[extensionName]
  }

  /**
   * 路由消息
   */
  private async routeMessage(message: ExtensionMessage): Promise<void> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to]

    for (const recipient of recipients) {
      try {
        await this.deliverMessage(message, recipient)
      } catch (error) {
        console.error(`Failed to deliver message to ${recipient}:`, error)
        this.stats.undeliveredCount++

        // 发送错误响应
        if (message.requiresAck) {
          await this.sendResponse(
            message,
            {
              message: error instanceof Error ? error.message : 'Delivery failed',
            },
            true
          )
        }
      }
    }
  }

  /**
   * 投递消息
   */
  private async deliverMessage(message: ExtensionMessage, recipient: string): Promise<void> {
    // 检查接收者是否存在
    const recipientInstance = extensionLoader.getExtensionInstance(recipient)
    if (!recipientInstance) {
      // 如果接收者不存在，将消息加入队列
      this.queueMessage(recipient, message)
      return
    }

    // 查找消息处理器
    const extensionHandlers = this.messageHandlers.get(recipient)
    const handler = extensionHandlers?.get(message.subject)

    if (!handler) {
      // 检查订阅
      const subscriptions = this.subscriptions.get(recipient) || []
      const subscription = subscriptions.find(sub => sub.subject === message.subject)

      if (subscription) {
        await this.invokeHandler(subscription.handler, message, recipient)
      } else {
        // 没有处理器，加入队列
        this.queueMessage(recipient, message)
      }
    } else {
      await this.invokeHandler(handler, message, recipient)
    }
  }

  /**
   * 调用消息处理器
   */
  private async invokeHandler(
    handler: ExtensionMessageHandler,
    message: ExtensionMessage,
    recipient: string
  ): Promise<void> {
    try {
      const senderInstance = extensionLoader.getExtensionInstance(message.from)
      const recipientInstance = extensionLoader.getExtensionInstance(recipient)

      if (!senderInstance || !recipientInstance) {
        throw new Error('Extension instance not found')
      }

      const context: ExtensionMessageContext = {
        sender: senderInstance,
        receiver: recipientInstance,
        reply: async (payload: unknown) => {
          await this.sendResponse(message, payload)
        },
        error: async (error: Error) => {
          await this.sendResponse(message, { message: error.message }, true)
        },
      }

      const _result = await handler(message, context)

      // 如果是请求消息且需要确认，自动发送响应
      if (message.type === 'request' && message.requiresAck && _result !== undefined) {
        await this.sendResponse(message, _result)
      }

      // 触发消息处理事件
      this.emit('messageHandled', { message, recipient, result: _result })
    } catch (error) {
      console.error(`Message handler error for ${recipient}:`, error)
      this.stats.errorCount++

      // 发送错误响应
      if (message.requiresAck) {
        await this.sendResponse(
          message,
          {
            message: error instanceof Error ? error.message : 'Handler error',
          },
          true
        )
      }
    }
  }

  /**
   * 将消息加入队列
   */
  private queueMessage(recipient: string, message: ExtensionMessage): void {
    const queue = this.messageQueue.get(recipient) || []
    queue.push(message)
    this.messageQueue.set(recipient, queue)
  }

  /**
   * 处理队列中的消息
   */
  private async processQueuedMessages(extensionName: string, subject: string): Promise<void> {
    const queue = this.messageQueue.get(extensionName) || []
    const relevantMessages = queue.filter(msg => msg.subject === subject)

    for (const message of relevantMessages) {
      try {
        await this.deliverMessage(message, extensionName)

        // 从队列中移除已处理的消息
        const updatedQueue = queue.filter(msg => msg.id !== message.id)
        this.messageQueue.set(extensionName, updatedQueue)
      } catch (error) {
        console.error(`Failed to process queued message:`, error)
      }
    }
  }

  /**
   * 设置消息传递
   */
  private setupMessageDelivery(): void {
    // 监听Extension加载事件
    extensionLoader.on('extensionLoaded', ({ name }) => {
      // 处理队列中的消息
      const queue = this.messageQueue.get(name) || []
      if (queue.length > 0) {
        setTimeout(() => {
          this.processQueuedMessages(name, '*')
        }, 100)
      }
    })

    // 监听Extension卸载事件
    extensionLoader.on('extensionUnloaded', ({ name }) => {
      this.cleanup(name)
    })
  }

  /**
   * 验证消息权限
   */
  private validateMessagePermission(message: ExtensionMessage): boolean {
    const senderInstance = extensionLoader.getExtensionInstance(message.from)
    if (!senderInstance) {
      return false
    }

    // 检查发送者是否有通信权限
    return (
      senderInstance.metadata.permissions.includes('extension:communicate') ||
      senderInstance.metadata.permissions.includes('*')
    )
  }

  /**
   * 更新统计信息
   */
  private updateStats(message: ExtensionMessage): void {
    this.stats.totalMessages++
    this.stats.byType[message.type]++

    // 更新发送者统计
    if (!this.stats.byExtension[message.from]) {
      this.stats.byExtension[message.from] = { sent: 0, received: 0 }
    }
    this.stats.byExtension[message.from].sent++

    // 更新接收者统计
    const recipients = Array.isArray(message.to) ? message.to : [message.to]
    for (const recipient of recipients) {
      if (!this.stats.byExtension[recipient]) {
        this.stats.byExtension[recipient] = { sent: 0, received: 0 }
      }
      this.stats.byExtension[recipient].received++
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建通信中心实例
 */
export function createExtensionCommunicationHub(): ExtensionCommunicationHub {
  return new ExtensionCommunicationHub()
}

/**
 * 默认通信中心实例
 */
export const extensionCommunicationHub = createExtensionCommunicationHub()

/**
 * Extension 通信 API
 * 提供给 Extension 使用的简化接口
 */
export class ExtensionCommunicationAPI {
  constructor(
    private extensionName: string,
    private hub: ExtensionCommunicationHub = extensionCommunicationHub
  ) {}

  /**
   * 注册消息处理器
   */
  onMessage(subject: string, handler: ExtensionMessageHandler): void {
    this.hub.registerMessageHandler(this.extensionName, subject, handler)
  }

  /**
   * 订阅消息主题
   */
  subscribe(subject: string, handler: ExtensionMessageHandler): () => void {
    return this.hub.subscribe(this.extensionName, subject, handler)
  }

  /**
   * 发送请求
   */
  async request(to: string, subject: string, payload: unknown): Promise<unknown> {
    return this.hub.sendRequest(this.extensionName, to, subject, payload)
  }

  /**
   * 发送通知
   */
  async notify(to: string | string[], subject: string, payload: unknown): Promise<void> {
    return this.hub.sendNotification(this.extensionName, to, subject, payload)
  }

  /**
   * 发送广播
   */
  async broadcast(subject: string, payload: unknown, exclude?: string[]): Promise<void> {
    return this.hub.sendBroadcast(this.extensionName, subject, payload, exclude)
  }

  /**
   * 获取消息历史
   */
  getHistory(subject?: string, limit?: number): ExtensionMessage[] {
    return this.hub.getMessageHistory(this.extensionName, subject, limit)
  }
}

/**
 * 创建Extension通信API
 */
export function createExtensionCommunicationAPI(extensionName: string): ExtensionCommunicationAPI {
  return new ExtensionCommunicationAPI(extensionName)
}
