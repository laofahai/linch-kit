/**
 * LinchKit Schema 数据库客户端适配器
 * 
 * 将 Prisma 客户端包装为 LinchKit Schema 的数据库适配器
 * 遵循 LinchKit 架构设计原则，不直接暴露第三方库
 */

import { PrismaClient } from '@prisma/client'

declare global {
  var __prismaClient: PrismaClient | undefined
}

/**
 * LinchKit Schema 数据库客户端
 * 基于 Prisma 的数据库访问层，提供企业级特性
 */
class LinchKitSchemaClient {
  private _prisma: PrismaClient

  constructor() {
    // 使用单例模式避免开发环境中的多实例问题
    this._prisma = globalThis.__prismaClient || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })

    if (process.env.NODE_ENV === 'development') {
      globalThis.__prismaClient = this._prisma
    }
  }

  /**
   * 连接数据库
   */
  async $connect() {
    return this._prisma.$connect()
  }

  /**
   * 断开数据库连接
   */
  async $disconnect() {
    return this._prisma.$disconnect()
  }

  /**
   * 执行原始查询
   */
  async $queryRaw(query: any, ...values: any[]) {
    return this._prisma.$queryRaw(query, ...values)
  }

  /**
   * 执行事务
   */
  async $transaction<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
    return this._prisma.$transaction(fn)
  }

  /**
   * 用户模型访问器
   */
  get user() {
    return this._prisma.user
  }

  /**
   * 租户模型访问器
   */
  get tenant() {
    return this._prisma.tenant
  }

  /**
   * 插件模型访问器
   */
  get plugin() {
    return this._prisma.plugin
  }

  /**
   * 租户插件关联模型访问器
   */
  get tenantPlugin() {
    return this._prisma.tenantPlugin
  }

  /**
   * 租户配额模型访问器
   */
  get tenantQuotas() {
    return this._prisma.tenantQuotas
  }

  /**
   * 监控数据模型访问器
   */
  get monitoringData() {
    return this._prisma.monitoringData
  }

  /**
   * 获取底层 Prisma 客户端（仅供内部使用）
   * @internal
   */
  _getPrismaClient(): PrismaClient {
    return this._prisma
  }
}

/**
 * LinchKit Schema 数据库客户端实例
 * 全局单例，提供统一的数据库访问接口
 */
export const schemaClient = new LinchKitSchemaClient()

/**
 * 向后兼容的 prisma 导出
 * @deprecated 请使用 schemaClient 代替
 */
export const prisma = schemaClient._getPrismaClient()